import { timeDay } from 'd3-time';
import { callBackfillAPI, callCoverageAPI, CoverageRow, EpiDataBackfillRow, ParsedCoverageRow } from '../../data/api';
import { GeoPair, SourceSignalPair, TimePair } from '../../data/apimodel';
import type { MetaDataManager, SensorSource } from '../../data/meta';
import { countyInfo, RegionLevel, stateCoreInfo } from '../../data/regions';
import { parseAPIDateAndWeek, parseAPITime, toTimeValue } from '../../data/utils';
import { Sensor, TimeFrame } from '../../stores/params';
import { addNameInfos, EpiDataRow } from '../../data';
import fetchTriple from '../../data/fetchTriple';
import type { RegionInfo } from '../../data/regions';
import { EpiDataMetaParsedInfo, SensorLike, splitDailyWeekly } from '../../data/sensor';
import { EpiWeek, weekRange } from '../../data/EpiWeek';

export interface SourceData extends SensorSource {
  ref: Sensor;
  latest_issue?: Date | null;
  latest_issue_week?: EpiWeek | null;
  latest_data?: Date | null;
  latest_data_week?: EpiWeek | null;
  latest_lag: string;
  latest_coverage?: number | null;
  coverages: ParsedCoverageRow[];
}

export function toLagToToday(meta?: EpiDataMetaParsedInfo | null): string {
  if (!meta) {
    return '?';
  }
  if (meta.time_type == 'day') {
    const now = new Date();
    const range = timeDay.count(meta.maxTime, now);
    return meta.maxTime != null ? `${range} day${range !== 1 ? 's' : ''}` : '?';
  }
  if (!meta.maxWeek) {
    return '?';
  }
  // week
  const nowWeek = EpiWeek.thisWeek();
  const range = weekRange(meta.maxWeek, nowWeek).length;
  return `${range} week${range !== 1 ? 's' : ''}`;
}

function toInitialData(sources: SensorSource[], manager: MetaDataManager): SourceData[] {
  return sources.map((source) => {
    const ref = source.referenceSensor!;
    const meta = manager.getMetaData(ref);
    return {
      ...source,
      ref,
      latest_issue: meta?.maxIssue,
      latest_issue_week: meta?.maxIssueWeek,
      latest_data: meta?.maxTime,
      latest_data_week: meta?.maxWeek,
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
      return initial.map((sourceData) => {
        const sourceCoverages: ParsedCoverageRow[] = coverages
          .filter((d) => d.source == sourceData.source && d.signal == sourceData.referenceSensor?.signal)
          .map((d) => ({
            ...d,
            ...parseAPIDateAndWeek(d.time_value),
            fraction: d.count / countyInfo.length,
          }));
        return {
          ...sourceData,
          supports_county: sourceData.referenceSensor && sourceData.referenceSensor.levels.includes('county'),
          latest_coverage: findLatestCoverage(sourceData.latest_data, sourceCoverages),
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

export function getAvailableCounties(
  ref: Sensor | null,
  date: Date,
  level: RegionLevel,
): Promise<(EpiDataRow & RegionInfo)[]> {
  if (!ref) {
    return Promise.resolve([]);
  }
  return fetchTriple(ref, level, date, {
    stderr: false,
  }).then((rows) => addNameInfos(rows).filter((d) => d.level === level)); // no mega-counties
}

export function fetchCoverage(ref: Sensor, coverageLevel: 'county' | 'state'): Promise<ParsedCoverageRow[]> {
  const total = coverageLevel === 'county' ? countyInfo.length : stateCoreInfo.length;
  return callCoverageAPI(
    ref.isWeeklySignal ? 'week' : 'day',
    SourceSignalPair.from(ref),
    coverageLevel === 'county' ? 'only-county' : 'state',
  ).then((cov) =>
    cov.map((d) => ({
      ...d,
      ...parseAPIDateAndWeek(d.time_value),
      fraction: d.count / total,
    })),
  );
}

export interface ProfileEntry extends EpiDataBackfillRow {
  date_value: Date;
  issue_date: Date;
  lag: number;
}

export function loadBackFillProfile(
  sensor: SensorLike & { isWeeklySignal?: boolean },
  region: RegionInfo,
  window: TimeFrame,
  referenceAnchorLag = 60,
): Promise<ProfileEntry[]> {
  return callBackfillAPI(
    SourceSignalPair.from(sensor),
    new TimePair(sensor.isWeeklySignal ? 'week' : 'day', window),
    GeoPair.from(region),
    referenceAnchorLag,
  ).then((rows) => {
    return rows.map((row) => {
      const date = parseAPITime(row.time_value);
      const issue = parseAPITime(row.issue);
      const diff = timeDay.count(date, issue);
      return {
        ...row,
        date_value: date,
        issue_date: issue,
        lag: sensor.isWeeklySignal ? Math.floor(diff / 7) : diff,
      };
    });
  });
}
