import {
  colorEncoding,
  CURRENT_DATE_HIGHLIGHT,
  stdErrLayer,
  stdErrTransform,
} from '../../components/DetailView/vegaSpec';

const stdErrTransformPercent = [
  {
    calculate: 'datum.value == null ? null : (datum.value - datum.stderr) / 100',
    as: 'value_lower_bound',
  },
  {
    calculate: 'datum.value == null ? null : (datum.value + datum.stderr) / 100',
    as: 'value_upper_bound',
  },
];

/**
 * @param {import('../../data').SensorEntry} sensor
 * @param {{info: import('../../maps').NameInfo, color: string}[]} selections
 * @param {?[Date, Date]} dateRange
 * @param {?{}} patchedYEncoding
 */
export function createSpec(sensor, selections, dateRange, patchedYEncoding = {}) {
  const isPercentage = sensor.format === 'percent';
  const yField = patchedYEncoding.field || (isPercentage ? 'pValue' : 'value');

  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: { name: 'values' },
    width: 'container',
    height: 'container',
    padding: 0,
    autosize: {
      resize: true,
    },
    transform: [
      ...(sensor.hasStdErr ? (isPercentage ? stdErrTransformPercent : stdErrTransform) : []),
      {
        calculate: 'datum.value == null ? null : datum.value / 100',
        as: 'pValue',
      },
    ],
    encoding: {
      color: colorEncoding(selections),
      x: {
        field: 'date_value',
        type: 'temporal',
        axis: {
          title: null,
          format: '%m/%d',
          formatType: 'time',
          tickCount: 'month',
        },
        scale: dateRange
          ? {
              domain: [dateRange[0].getTime(), dateRange[1].getTime()],
            }
          : {},
      },
    },
    layer: [
      {
        mark: {
          type: 'line',
          interpolate: 'linear',
        },
        encoding: {
          y: {
            field: yField,
            type: 'quantitative',
            scale: patchedYEncoding.scale,
            axis: {
              ...(isPercentage ? { format: '.1%' } : {}),
              title: null,
              tickCount: 3,
              minExtent: 25,
            },
          },
        },
      },
      {
        selection: {
          highlight: {
            type: 'single',
            empty: 'none',
            on: 'mouseover',
            nearest: true,
            clear: 'mouseout',
          },
        },
        mark: {
          type: 'point',
          tooltip: true,
          radius: 1,
          stroke: null,
          fill: 'grey',
        },
        encoding: {
          opacity: {
            condition: [
              {
                selection: 'highlight',
                value: 1,
              },
              {
                test: 'datum.time_value == highlightTimeValue',
                value: 1,
              },
            ],
            value: 0,
          },
          y: {
            field: yField,
            type: 'quantitative',
          },
        },
      },
      // complicated construct to have proper typings
      ...(sensor.hasStdErr ? [stdErrLayer] : []),
      {
        transform: [
          {
            filter: {
              or: [
                {
                  selection: 'highlight',
                },
                'datum.time_value == highlightTimeValue',
              ],
            },
          },
        ],
        mark: 'rule',
        encoding: {
          y: {
            field: yField,
            type: 'quantitative',
          },
        },
      },
      CURRENT_DATE_HIGHLIGHT,
    ],
    config: {
      legend: {
        disable: true,
      },
    },
  };

  return spec;
}
