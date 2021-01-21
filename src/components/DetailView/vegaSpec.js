import merge from 'lodash-es/merge';
import { CURRENT_DATE_HIGHLIGHT } from '../vegaSpecUtils';

/**
 * @type {import('vega-lite/build/src/spec').LayerSpec | import('vega-lite/build/src/spec').UnitSpec}
 */
export const stdErrLayer = {
  mark: {
    type: 'area',
    interpolate: 'monotone',
  },
  encoding: {
    color: {
      field: 'geo_value',
    },
    opacity: {
      value: 0.25,
    },
    y: {
      field: 'value_lower_bound',
      type: 'quantitative',
    },
    y2: {
      field: 'value_upper_bound',
    },
  },
};

/**
 * @type {import('vega-lite/build/src/transform').Transform[]}
 */
export const stdErrTransform = [
  {
    calculate: 'datum.value == null ? null : datum.value - datum.stderr',
    as: 'value_lower_bound',
  },
  {
    calculate: 'datum.value == null ? null : datum.value + datum.stderr',
    as: 'value_upper_bound',
  },
];

export const xDateEncoding = {
  field: 'date_value',
  type: 'temporal',
  axis: {
    orient: 'bottom',
    labels: false,
    title: null,
  },
};

const xDateRangeEncoding = {
  ...xDateEncoding,
  axis: {
    orient: 'bottom',
    title: null,
    format: '%m/%d',
    formatType: 'time',
    tickCount: 'week',
    grid: true,
    labelSeparation: 10, // Should be based on font size.
  },
};

/**
 * @param {{info: import('../../maps').NameInfo, color: string}[]} selections
 */
export function colorEncoding(selections) {
  if (!selections) {
    return {
      value: 'grey',
    };
  }
  return {
    field: 'geo_value',
    type: 'nominal',
    scale: {
      domain: selections.map((d) => d.info.propertyId),
      range: selections.map((d, i) => (i === 0 ? 'grey' : d.color)),
    },
  };
}

/**
 * @param {import('../../data').SensorEntry} sensor
 * @param {string} primaryValue
 * @param {{info: import('../../maps').NameInfo, color: string}[]} selections
 * @param {[Date, Date]} initialSelection
 * @param {Array<string>} title
 */
export function createSpec(sensor, primaryValue, selections, initialSelection, title) {
  const ratioSuffix =
    primaryValue === 'countRatioCumulative' || primaryValue === 'avgRatio' ? ' per 100,000 people' : '';
  const yAxisTitle = sensor.yAxis + ratioSuffix;

  const isCumulative = primaryValue === 'countRatioCumulative' || primaryValue === 'countCumulative';
  const leftPadding = isCumulative ? 60 : 50;

  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    title: {
      text: title,
      font: '"Open Sans", Helvetica, sans-serif',
      fontSize: 14.08,
      fontWeight: 700,
      lineHeight: 22,
      color: '#666',
    },
    data: {
      name: 'values',
      values: initialSelection
        ? [
            {
              date_value: initialSelection[0],
              value: 0,
            },
            {
              date_value: initialSelection[1],
              value: 1,
            },
          ]
        : [],
    },
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    padding: { left: leftPadding, right: 2, top: 50, bottom: 5 },
    transform: sensor.hasStdErr ? stdErrTransform : [],
    vconcat: [
      {
        encoding: {
          x: {
            ...xDateEncoding,
            scale: { domain: { selection: 'dateRange' } },
          },
        },
        resolve: { axis: { x: 'independent' } },
        layer: [
          {
            mark: {
              type: 'line',
              interpolate: 'monotone',
            },
            encoding: {
              color: colorEncoding(selections),
              x: {
                ...xDateRangeEncoding,
              },
              y: {
                field: primaryValue,
                type: 'quantitative',
                scale: {
                  domainMin: 0,
                },
                axis: {
                  minExtent: 25,
                  title: yAxisTitle,
                },
              },
            },
          },
          {
            transform: [
              // Only highlight the 0th location, rather than randomly picking one of them.
              {
                filter: `datum.geo_value == '${selections[0].info.propertyId}'`,
              },
            ],
            selection: {
              highlight: {
                type: 'single',
                empty: 'none',
                nearest: true,
                encodings: ['x'],
                on: 'mousedown',
                clear: 'dblclick',
              },
            },
            mark: {
              type: 'circle',
              tooltip: true,
            },
            encoding: {
              color: {
                field: 'geo_value',
              },
              x: {
                ...xDateRangeEncoding,
                axis: {
                  ...xDateRangeEncoding.axis,
                  labels: false,
                  grid: false,
                  tickCount: 'day',
                },
              },
              y: {
                field: primaryValue,
                type: 'quantitative',
              },
            },
          },

          // Other end of range selection.  Doesn't work, unfortunately.
          // {
          //   transform: [
          //     // Only highlight the 0th location, rather than randomly picking one of them.
          //     {
          //       filter: `datum.geo_value == '${selections[0].info.propertyId}'`,
          //     },
          //   ],
          //   selection: {
          //     otherDate: {
          //       type: 'single',
          //       empty: 'none',
          //       nearest: true,
          //       encodings: ['x'],
          //       on: 'click',
          //       //clear: 'dblclick',
          //     },
          //   },
          //   mark: {
          //     type: 'circle',
          //     tooltip: true,
          //   },
          //   encoding: {
          //     color: {
          //       field: 'geo_value',
          //     },
          //     x: {
          //       ...xDateRangeEncoding,
          //     },
          //     y: {
          //       field: primaryValue,
          //       type: 'quantitative',
          //     },
          //   },
          // },

          // Range selector within main chart area
          // {
          //   selection: {
          //     range: {
          //       type: 'interval',
          //       nearest: true,
          //       empty: 'none',

          //       encodings: ['x'],
          //       mark: {
          //         type: 'rect',
          //         fillOpacity: 0.01,
          //         cursor: 'move',
          //         // strokeOpacity: 0,
          //       },
          //     },
          //   },
          //   mark: {
          //     type: 'point',
          //   },
          //   encoding: {
          //     x: { ...xDateRangeEncoding },
          //     y: {
          //       field: primaryValue,
          //       type: 'quantitative',
          //       axis: {
          //         minExtent: 25,
          //         tickCount: 3,
          //         title: ' ',
          //       },
          //     },
          //   },
          // },

          // Insert 'error bar', if the data includes it.
          // Using complicated construct to have proper typings.
          ...(sensor.hasStdErr ? [stdErrLayer] : []),

          {
            transform: [
              {
                filter: {
                  selection: 'highlight',
                },
              },
            ],
            mark: 'rule',
            encoding: {
              y: {
                field: primaryValue,
                type: 'quantitative',
              },
            },
          },

          // // Show area under data within range selection.
          {
            transform: [
              {
                filter: `datum.geo_value == '${selections[0].info.propertyId}'`,
              },
              // { as: 'end', calculate: 'isValid(otherDate.date_value) ? otherDate.date_value : highlight.date_value' },
              { as: 'end', calculate: 'highlight.date_value' },
              { as: 'left', calculate: 'min(toDate(currentDate), datum.end)' },
              { as: 'right', calculate: 'max(toDate(currentDate), datum.end)' },
              {
                filter: 'datum.left <= datum.date_value && datum.date_value <= datum.right',
              },
            ],
            mark: { type: 'area', opacity: 0.1 },
            encoding: {
              y: {
                field: primaryValue,
                type: 'quantitative',
              },
            },
          },

          // {
          //   transform: [
          //     {
          //       filter: {
          //         selection: 'range',
          //       },
          //     },

          //     {
          //       aggregate: [
          //         {
          //           op: 'argmin',
          //           field: 'date_value',
          //           as: 'leftmost',
          //         },
          //         {
          //           op: 'argmax',
          //           field: 'date_value',
          //           as: 'rightmost',
          //         },
          //       ],
          //     },
          //     { as: 'left', calculate: `datum.leftmost.date_value` },
          //     { as: 'right', calculate: `datum.rightmost.date_value` },
          //     {
          //       as: 'mid_date',
          //       calculate: 'time(datum.right)/2 + time(datum.left)/2',
          //     },
          //     { as: 'left_value', calculate: `datum.leftmost.${primaryValue}` },
          //     { as: 'right_value', calculate: `datum.rightmost.${primaryValue}` },
          //     { as: 'increasing', calculate: `datum.left_value < datum.right_value` },
          //     { as: 'top', calculate: `max(datum.left_value, datum.right_value)` },
          //     { as: 'bottom', calculate: `min(datum.left_value, datum.right_value)` },
          //     { as: 'arrowheadPoint', calculate: 'datum.increasing ? datum.top : datum.bottom' },
          //     { as: 'diff_value', calculate: 'datum.top - datum.bottom' },
          //     { as: 'mid_value', calculate: 'datum.bottom + datum.diff_value / 2' },
          //   ],

          //   layer: [
          //     // Bounding rules
          //     {
          //       mark: { type: 'rule', stroke: 'black', opacity: 0.5, size: 1 },
          //       encoding: {
          //         x: null,
          //         y: {
          //           field: 'top',
          //           type: 'quantitative',
          //         },
          //       },
          //     },
          //     {
          //       mark: { type: 'rule', stroke: 'black', opacity: 0.5, size: 1 },
          //       encoding: {
          //         x: null,
          //         y: {
          //           field: 'bottom',
          //           type: 'quantitative',
          //         },
          //       },
          //     },

          //     // Range value difference label, at mid-point.
          //     {
          //       mark: {
          //         type: 'text',
          //         fontSize: 14,
          //         dx: -20,
          //       },
          //       encoding: {
          //         x: {
          //           field: 'mid_date',
          //         },
          //         y: {
          //           field: 'mid_value',
          //           type: 'quantitative',
          //         },
          //         text: {
          //           field: 'diff_value',
          //           format: '-.2f',
          //         },
          //       },
          //     },

          //     // Rule for arrow.
          //     {
          //       mark: {
          //         type: 'rule',
          //         strokeWidth: 1,
          //         opacity: 0.9,
          //         color: { expr: 'datum.increasing ? "red" : "green"' },
          //       },
          //       encoding: {
          //         x: { field: 'mid_date', type: 'temporal' },
          //         y: {
          //           field: 'top',
          //           type: 'quantitative',
          //         },
          //         y2: {
          //           field: 'bottom',
          //           type: 'quantitative',
          //         },
          //       },
          //     },
          //     // Arrowhead
          //     {
          //       mark: {
          //         type: 'point',
          //         shape: 'triangle',
          //         angle: { expr: 'datum.increasing ? 0 : 180' },
          //         size: 100,
          //         yOffset: { expr: 'datum.increasing ? 6 : -6' },
          //         color: { expr: 'datum.increasing ? "red" : "green"' },
          //         opacity: 0.9,
          //         fillOpacity: 0.8,
          //         filled: true,
          //       },
          //       encoding: {
          //         x: { field: 'mid_date' },
          //         y: {
          //           field: 'arrowheadPoint',
          //           type: 'quantitative',
          //         },
          //       },
          //     },
          //   ],
          // },

          // // Hover over data point, for tooltip.
          // {
          //   transform: [
          //     {
          //       filter: {
          //         selection: 'highlight',
          //       },
          //     },
          //   ],
          //   mark: {
          //     type: 'rule',
          //     strokeOpacity: 0.3,
          //   },
          //   encoding: {
          //     y: {
          //       field: primaryValue,
          //       type: 'quantitative',
          //     },
          //   },
          // },

          CURRENT_DATE_HIGHLIGHT,
        ],
      },

      {
        height: 40,
        padding: { top: 0 },
        view: { cursor: 'col-resize' },
        encoding: {
          color: {
            field: 'geo_value',
          },
          x: { ...xDateRangeEncoding },
          y: {
            field: primaryValue,
            type: 'quantitative',
            axis: {
              minExtent: 25,
              tickCount: 3,
              title: ' ',
            },
          },
        },
        layer: [
          {
            selection: {
              dateRange: {
                type: 'interval',
                encodings: ['x'],
                init: {
                  x: [initialSelection[0].getTime(), initialSelection[1].getTime()],
                },
                mark: { cursor: 'move' },
              },
            },
            mark: {
              type: 'line',
              interpolate: 'monotone',
            },
            encoding: {
              y: {
                field: primaryValue,
                type: 'quantitative',
                axis: {
                  minExtent: 25,
                  tickCount: 3,
                  title: ' ',
                },
              },
            },
          },
          // complicated construct to have proper typings
          ...(sensor.hasStdErr ? [stdErrLayer] : []),
          {
            selection: {
              highlight2: {
                type: 'single',
                empty: 'none',
                nearest: true,
                encodings: ['x'],
                on: 'mouseover',
                clear: 'mouseout',
              },
            },
            transform: [
              {
                filter: {
                  selection: 'highlight2',
                },
              },
            ],
            mark: 'rule',
            encoding: {
              y: {
                field: primaryValue,
                type: 'quantitative',
              },
            },
          },
          CURRENT_DATE_HIGHLIGHT,
        ],
      },
    ],
    config: {
      customFormatTypes: true,
      legend: {
        disable: true,
      },
    },
  };

  if (sensor.isCasesOrDeath) {
    // patch in the the cases / death count lines
    const casesCountLine = {
      mark: {
        type: 'line',
        interpolate: 'monotone',
        opacity: 0.2,
      },
      encoding: {
        y: {
          field: primaryValue.replace('avg', 'count'),
          type: 'quantitative',
        },
        color: {
          field: 'geo_value',
        },
      },
    };
    spec.vconcat[0].layer.unshift(casesCountLine);
    spec.vconcat[1].layer.unshift(casesCountLine);
  }

  return spec;
}

// Reserve space for titles.
const OFFSET_Y = 110;
const RANGE_SELECTOR_HEIGHT = 40;

/**
 * patches in the current size
 * @param {import('vega-lite').TopLevelSpec} spec
 * @param {{width: number, height: number}} size
 */
export function patchSpec(spec, size) {
  return merge({}, spec, {
    vconcat: [
      {
        height: Math.floor(size.height - RANGE_SELECTOR_HEIGHT - OFFSET_Y),
      },
      {
        height: RANGE_SELECTOR_HEIGHT,
      },
    ],
  });
}
