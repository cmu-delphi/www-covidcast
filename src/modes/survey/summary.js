import { timeDay } from 'd3-time';
import { fetchMultiSignal, formatAPITime } from '../../data';
import { getInfoByName } from '../../maps';
import { dataSource, sections, formatTime } from './sections';

/**
 * @param {Date} date
 */
function computeRelatedTimeStamps(date) {
  return [
    {
      date,
      label: formatTime(date),
    },
    {
      date: timeDay.offset(date, -1),
      label: 'The day before',
    },
    {
      date: timeDay.offset(date, -7),
      label: 'A week ago',
    },
    {
      date: timeDay.offset(date, -14),
      label: 'Two weeks ago',
    },
  ];
}
/**
 * @param {import('../../maps').NameInfo} region
 */
function computeRelatedRegions(region) {
  if (!region) {
    return [];
  }
  if (region.level !== 'county') {
    return [{ region, label: region.displayName }];
  }
  const stateRegion = region.level === 'county' ? getInfoByName(region.state) : null;

  return [
    { region, label: region.displayName },
    { region: stateRegion, label: stateRegion.displayName },
  ];
}
/**
 * @param {Date} date
 * @param {'none' | 'region' | 'date'} related
 */
export function computeRelatedGroups(date, region, related) {
  if (related === 'date') {
    return computeRelatedTimeStamps(date);
  }
  if (related === 'region') {
    return computeRelatedRegions(region);
  }
  return [];
}
/**
 * @param {Date} date
 * @param {import('../../maps').NameInfo} region
 * @param {'none' | 'region' | 'date'} related
 */
export function loadSummaryData(date, region, related) {
  if (!date || !region) {
    return Promise.resolve([]);
  }
  // collect all data to load
  const signals = sections
    .map((d) => d.questions.map((d) => d.indicators))
    .flat(2)
    .map((d) => d.signal);

  if (related === 'none') {
    return fetchMultiSignal(dataSource, signals, date, region, ['issue', 'sample_size']);
  }
  if (related === 'region') {
    const regions = computeRelatedRegions(region);
    return Promise.all(
      regions.map((region) => fetchMultiSignal(dataSource, signals, date, region.region, ['issue', 'sample_size'])),
    ).then((data) => {
      return regions
        .map((r, i) => {
          const rows = data[i];
          for (const row of rows) {
            row.group = r.label;
          }
          return rows;
        })
        .flat();
    });
  }
  if (related === 'date') {
    const relatedTimeStamps = computeRelatedTimeStamps(date);
    return fetchMultiSignal(
      dataSource,
      signals,
      relatedTimeStamps.map((d) => d.date),
      region,
      ['issue', 'sample_size'],
    ).then((data) => {
      const lookup = new Map(relatedTimeStamps.map((d) => [formatAPITime(d.date), d.label]));

      // sort by date
      data.sort((a, b) => {
        if (a.time_value !== b.time_value) {
          return a.time_value < b.time_value ? -1 : 1;
        }
        return a.signal.localeCompare(b.signal);
      });
      // extend the rows with a 'group' to be used in the vega spec

      for (const row of data) {
        row.group = lookup.get(row.time_value.toString()) || 'Unknown';
      }
      return data;
    });
  }
}
