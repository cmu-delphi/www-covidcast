import { timeDay } from 'd3-time';
import { callCoverageAPI, CoverageRow } from '../../data/api';
import { SourceSignalPair } from '../../data/apimodel';
import type { MetaDataManager, SensorSource } from '../../data/meta';
import { countyInfo } from '../../data/regions';
import { parseAPITime, toTimeValue } from '../../data/utils';
import { Sensor, TimeFrame } from '../../stores/params';

function findLatestCoverage(latest: Date | null | undefined, coverages: CoverageRow[]) {
  if (!coverages || !latest) {
    return null;
  }
  const time = toTimeValue(latest);
  const latestEntry = coverages.find((d) => d.time_value === time);
  if (!latestEntry) {
    return null;
  }
  return latestEntry.count / countyInfo.length;
}

export interface SourceData extends SensorSource {
  ref: Sensor;
  latest_issue?: Date | null;
  latest_data?: Date | null;
  latest_lag?: number | null;
  latest_coverage?: number | null;
  coverages: CoverageRow[];
}

function toInitialData(sources: SensorSource[], manager: MetaDataManager): SourceData[] {
  const now = new Date();
  return sources.map((source) => {
    const ref = manager.getReferenceSignal(source)!;
    const meta = manager.getMetaData(ref);
    return {
      ...source,
      ref,
      latest_issue: meta?.maxIssue,
      latest_data: meta?.maxTime,
      latest_lag: meta?.maxTime != null ? timeDay.count(meta.maxTime, now) : null,
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
  const loaded = callCoverageAPI(SourceSignalPair.fromArray(initial.map((d) => d.ref)), 'only-county', days).then(
    (coverages) => {
      return initial.map((r) => {
        const sourceCoverages = coverages.filter((d) => d.source == r.source && d.signal == r.reference_signal);
        return {
          ...r,
          latest_coverage: findLatestCoverage(r.latest_data, sourceCoverages),
          coverages: sourceCoverages.map((d) => ({
            ...d,
            date: parseAPITime(d.time_value),
            fraction: d.count / countyInfo.length,
          })),
        };
      });
    },
  );
  return { initial, loaded, domain };
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
