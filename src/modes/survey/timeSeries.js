import { addMissing, fetchTimeSlice } from '../../data';
import { dataSource, sections } from './sections';

/**
 * @param {import('../../maps').NameInfo} region
 * @param {[Date, Date]} startEndDates
 */
export function loadTimeSeriesData(region, startEndDates) {
  if (!region || startEndDates.length === 0) {
    return new Map();
  }
  // collect all data to load
  const signals = sections
    .map((d) => d.questions.map((d) => d.indicators))
    .flat(2)
    .map((d) => d.signal);

  return new Map(
    signals.map((signal) => {
      const fakeSensor = {
        id: dataSource,
        signal,
      };
      const data = fetchTimeSlice(
        fakeSensor,
        region.level,
        region.propertyId,
        startEndDates[0],
        startEndDates[1],
        false,
        {
          geo_value: region.propertyId,
        },
      ).then((r) => addMissing(r));

      return [signal, data];
    }),
  );
}

/**
 * @param {boolean} showErrorBars
 * @param {[Date, Date]} startEndDates
 */
export function createTimeSeriesSpec(showErrorBars, startEndDates) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: { name: 'values' },
    width: 'container',
    height: 50,
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
        field: 'date_value',
        type: 'temporal',
        axis: {
          title: 'Date',
          format: '%m/%d',
          formatType: 'time',
          tickCount: 'day',
          grid: true,
          labelSeparation: 10, // Should be based on font size.
        },
        scale:
          startEndDates.length > 0
            ? {
                domain: [startEndDates[0].getTime(), startEndDates[1].getTime()],
              }
            : {},
      },
      y: {
        field: 'pValue',
        type: 'quantitative',
        axis: {
          format: '.1%',
          title: 'Percentage',
          minExtent: 40,
        },
      },
    },
    layer: [
      ...(showErrorBars
        ? [
            {
              mark: 'errorband',
              encoding: {
                yError: { field: 'pStdErr' },
              },
            },
          ]
        : []),
      {
        mark: {
          type: 'line',
          point: true,
          tooltip: {
            content: 'encoding',
          },
        },
      },
    ],
  };

  return spec;
}
