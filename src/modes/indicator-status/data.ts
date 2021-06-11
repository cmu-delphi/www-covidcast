import { timeDay } from 'd3-time';
import { Coverage, getIndicatorStatuses, IndicatorStatus } from '../../data/indicatorInfo';
import { countyInfo } from '../../data/regions';
import { TimeFrame } from '../../stores/params';

export interface ExtendedStatus extends IndicatorStatus {
  latest_lag: number;
  latest_coverage: number;
}

function findLatestCoverage(latest: Date, coverages: Coverage[]) {
  if (!coverages) {
    return null;
  }
  const time = latest.getTime();
  const latestEntry = coverages.find((d) => d.date.getTime() === time);
  if (!latestEntry) {
    return null;
  }
  return latestEntry.count / countyInfo.length;
}

export function loadData(date: Date): Promise<ExtendedStatus[]> {
  return getIndicatorStatuses().then((rows) =>
    rows.map((r) => ({
      ...r,
      latest_lag: timeDay.count(r.latest_time_value, date),
      latest_coverage: findLatestCoverage(r.latest_time_value, r.coverage.county)!,
    })),
  );
}

export function determineDomain(data: IndicatorStatus[]): TimeFrame {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  if (data.length === 0) {
    return new TimeFrame(timeDay.offset(new Date(), -1), timeDay.floor(new Date()));
  }
  for (const row of data) {
    for (const coverage of row.coverage.county || []) {
      const d = coverage.date.getTime();
      if (d < min) {
        min = d;
      }
      if (d > max) {
        max = d;
      }
    }
  }
  return new TimeFrame(new Date(min), new Date(max));
}
