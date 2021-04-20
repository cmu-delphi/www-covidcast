import { timeDay } from 'd3-time';
import { getIndicatorStatuses } from '../../data/indicatorInfo';
import { countyInfo } from '../../data/regions';
import { TimeFrame } from '../../stores/params';

/**
 * @typedef {import('../../data/indicatorInfo').IndicatorStatus} ExtendedStatus
 * @property {number} latest_lag
 * @property {number} latest_coverage
 */

/**
 *
 * @param {Date} latest
 * @param {import('../../data/indicatorInfo').Coverage[]} coverages
 */
function findLatestCoverage(latest, coverages) {
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
/**
 *
 * @param {Date}date
 * @returns {Promise<ExtendedStatus[]>}
 */
export function loadData(date) {
  return getIndicatorStatuses().then((rows) =>
    rows.map((r) => ({
      ...r,
      latest_lag: timeDay.count(r.latest_time_value, date),
      latest_coverage: findLatestCoverage(r.latest_time_value, r.coverage.county),
    })),
  );
}

export function determineDomain(data) {
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
