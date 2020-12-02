import { createSignalDateHighlight, CURRENT_DATE_HIGHLIGHT } from '../../components/DetailView/vegaSpec';
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
  const indicators = sections.map((d) => d.questions.map((d) => d.indicators)).flat(2);

  return new Map(
    indicators.map((indicator) => {
      const sensor = indicator.sensor || {
        id: dataSource,
        signal: indicator.signal,
        hasStdErr: true,
      };
      const data = fetchTimeSlice(
        sensor,
        region.level,
        region.propertyId,
        startEndDates[0],
        startEndDates[1],
        false,
        {
          geo_value: region.propertyId,
        },
        { advanced: true },
      ).then((r) => addMissing(r));

      return [indicator.signal, data];
    }),
  );
}

/**
 * @param {[Date, Date]} startEndDates
 */
export function createTimeSeriesSpec(startEndDates) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: { name: 'values' },
    padding: { left: 50, top: 6, bottom: 20, right: 2 },
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    transform: [
      {
        calculate: 'datum.value == null ? null : datum.value * 10',
        as: 'kValue',
      },
    ],
    layer: [
      {
        mark: {
          type: 'line',
          point: false,
          color: 'grey',
          tooltip: {
            content: 'encoding',
          },
        },
        encoding: {
          x: {
            field: 'date_value',
            type: 'temporal',
            title: null,
            axis: {
              format: '%m/%d',
              formatType: 'cachedTime',
              tickCount: 'month',
              grid: false,
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
            field: 'kValue',
            type: 'quantitative',
            axis: {
              format: '.1d',
              title: null,
              grid: false,
            },
          },
        },
      },
      createSignalDateHighlight('maxDate', 'gray'),
      CURRENT_DATE_HIGHLIGHT,
    ],
    config: {
      customFormatTypes: true,
      view: {
        stroke: false,
      },
    },
  };

  return spec;
}
