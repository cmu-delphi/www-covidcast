import { timeDay } from 'd3-time';
import { callBackfillAPI, callCoverageAPI, CoverageRow, EpiDataBackfillRow, ParsedCoverageRow } from '../../data/api';
import { GeoPair, SourceSignalPair, TimePair } from '../../data/apimodel';
import type { EpiDataMetaParsedInfo, MetaDataManager, SensorLike, SensorSource } from '../../data/meta';
import { countyInfo } from '../../data/regions';
import { parseAPIDateAndWeek, parseAPITime, toTimeValue } from '../../data/utils';
import { Sensor, TimeFrame } from '../../stores/params';
import { addNameInfos, EpiDataRow } from '../../data';
import fetchTriple from '../../data/fetchTriple';
import type { RegionInfo } from '../../data/regions';
import { splitDailyWeekly } from '../../data/sensor';

export interface SourceData extends SensorSource {
  ref: Sensor;
  latest_issue?: Date | null;
  latest_data?: Date | null;
  latest_lag?: number | null;
  latest_coverage?: number | null;
  coverages: ParsedCoverageRow[];
}

export function toLagToToday(meta?: EpiDataMetaParsedInfo | null): number | null {
  const now = new Date();
  return meta?.maxTime != null ? timeDay.count(meta.maxTime, now) : null;
}

function toInitialData(sources: SensorSource[], manager: MetaDataManager): SourceData[] {
  return sources.map((source) => {
    const ref = source.referenceSensor!;
    const meta = manager.getMetaData(ref);
    return {
      ...source,
      ref,
      latest_issue: meta?.maxIssue,
      latest_data: meta?.maxTime,
      latest_lag: toLagToToday(meta),
      latest_coverage: null,
      coverages: [],
    };
  });
}

export function loadData(
  sources: SensorSource[],
  manager: MetaDataManager,
): {
  initial: SourceData[];
  loaded: Promise<SourceData[]>;
  domain: TimeFrame;
} {
  const initial = toInitialData(sources, manager);
  const days = 20;
  const domain = determineDomain(initial, days);

  const sensors = initial.map((d) => d.ref);
  const [day, week] = splitDailyWeekly(sensors);
  const loaded = Promise.all([
    day.sensors.length === 0
      ? []
      : callCoverageAPI(day.type, SourceSignalPair.fromArray(day.sensors), 'only-county', days),
    week.sensors.length === 0
      ? []
      : callCoverageAPI(week.type, SourceSignalPair.fromArray(week.sensors), 'only-county', days),
  ])
    .then((r) => ([] as CoverageRow[]).concat(...r))
    .then((coverages) => {
      return initial.map((r) => {
        const sourceCoverages: ParsedCoverageRow[] = coverages
          .filter((d) => d.source == r.source && d.signal == r.referenceSensor?.signal)
          .map((d) => ({
            ...d,
            ...parseAPIDateAndWeek(d.time_value),
            fraction: d.count / countyInfo.length,
          }));
        return {
          ...r,
          latest_coverage: findLatestCoverage(r.latest_data, sourceCoverages),
          coverages: sourceCoverages,
        };
      });
    });
  return { initial, loaded, domain };
}

export function findLatestCoverage(latest: Date | null | undefined, coverages: ParsedCoverageRow[]): number | null {
  if (!coverages || !latest) {
    return null;
  }
  const time = toTimeValue(latest);
  // d.time_value could be a week
  const latestEntry = coverages.find((d) => toTimeValue(d.date) === time);
  if (!latestEntry) {
    return null;
  }
  return latestEntry.fraction;
}

function determineDomain(data: SourceData[], days: number): TimeFrame {
  const min = timeDay.offset(new Date(), -days);
  let max = Number.NEGATIVE_INFINITY;
  if (data.length === 0) {
    return new TimeFrame(min, timeDay.floor(new Date()));
  }
  for (const row of data) {
    if (row.latest_data == null) {
      continue;
    }
    if (row.latest_data.getTime() > max) {
      max = row.latest_data.getTime();
    }
  }
  return new TimeFrame(min, new Date(max));
}

export function getAvailableCounties(ref: Sensor | null, date: Date): Promise<(EpiDataRow & RegionInfo)[]> {
  if (!ref) {
    return Promise.resolve([]);
  }
  return fetchTriple(ref, 'county', date, {
    stderr: false,
  }).then((rows) => addNameInfos(rows).filter((d) => d.level === 'county')); // no mega-counties
}

export function fetchCoverage(ref: Sensor): Promise<ParsedCoverageRow[]> {
  return callCoverageAPI(ref.isWeeklySignal ? 'week' : 'day', SourceSignalPair.from(ref), 'only-county').then((cov) =>
    cov.map((d) => ({
      ...d,
      ...parseAPIDateAndWeek(d.time_value),
      fraction: d.count / countyInfo.length,
    })),
  );
}

export interface ProfileEntry extends EpiDataBackfillRow {
  date_value: Date;
  issue_date: Date;
  lag: number;
}

export function loadBackFillProfile(
  sensor: SensorLike,
  region: RegionInfo,
  window: TimeFrame,
  referenceAnchorLag = 60,
): Promise<ProfileEntry[]> {
  return callBackfillAPI(
    SourceSignalPair.from(sensor),
    new TimePair('day', window),
    GeoPair.from(region),
    referenceAnchorLag,
  ).then((rows) => {
    return rows.map((row) => {
      const date = parseAPITime(row.time_value);
      const issue = parseAPITime(row.issue);
      return {
        ...row,
        date_value: date,
        issue_date: issue,
        lag: timeDay.count(date, issue),
      };
    });
  });
}
