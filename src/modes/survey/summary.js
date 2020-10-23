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

/**
 * @param {boolean} showErrorBars
 * @param {{label: string}[]} relatedGroups
 */
export function createVegaSpec(showErrorBars, relatedGroups) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: { name: 'values' },
    width: 'container',
    height: Math.max(relatedGroups.length, 1) * 30,
    padding: 0,
    transform: [
      {
        calculate: 'datum.value == null ? null : datum.stderr / 100',
        as: 'pStdErr',
      },
      {
        calculate: 'datum.value == null ? null : datum.value / 100',
        as: 'pValue',
      },
      {
        calculate: 'datum.pValue == null ? null : datum.pValue + datum.pStdErr',
        as: 'pValueAndStdErr',
      },
    ],
    encoding: {
      x: {
        field: 'pValue',
        type: 'quantitative',
        scale: {
          domain: [0, 1],
          clamp: true,
        },
        axis: {
          format: '.1%',
          title: 'Percentage',
        },
      },
      y: {
        field: 'group',
        type: 'nominal',
        scale:
          relatedGroups.length > 0
            ? {
                domain: relatedGroups.map((d) => d.label),
              }
            : {},
        axis:
          relatedGroups.length > 0
            ? {
                title: null,
              }
            : null,
      },
    },
    layer: [
      {
        mark: 'bar',
      },
      ...(showErrorBars
        ? [
            {
              mark: 'errorbar',
              encoding: {
                xError: { field: 'pStdErr' },
              },
            },
          ]
        : []),
      {
        mark: {
          type: 'text',
          align: 'left',
          baseline: 'middle',
          dx: 3,
        },
        encoding: {
          x: {
            field: showErrorBars ? 'pValueAndStdErr' : 'pValue', // shift by value and stderr
            type: 'quantitative',
          },
          text: {
            field: 'pValue',
            type: 'quantitative',
            format: '.1%',
          },
        },
      },
    ],
  };

  return spec;
}
