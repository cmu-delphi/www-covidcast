import merge from 'lodash-es/merge';

/**
 * @type {import('vega-lite/build/src/spec').LayerSpec | import('vega-lite/build/src/spec').UnitSpec}
 */
export const CURRENT_DATE_HIGHLIGHT = {
  description: 'shows the current data injected via a signal',
  data: {
    values: [
      {
        date_value: null,
      },
    ],
  },
  transform: [
    {
      calculate: 'toDate(currentDate)',
      as: 'date_value',
    },
  ],
  mark: {
    type: 'rule',
    tooltip: false,
  },
  encoding: {
    color: {
      value: '#c00',
    },
    x: {
      field: 'date_value',
      type: 'temporal',
    },
  },
};

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
            selection: {
              range: {
                type: 'interval',
                nearest: true,
                empty: 'none',
                encodings: ['x'],
                mark: {
                  type: 'rect',
                  fillOpacity: 0.05,
                  stroke: 'green',
                  strokeOpacity: 0.01,
                  strokeWidth: 3,
                  cursor: 'move',
                },
              },
            },
            mark: {
              type: 'point',
            },
            encoding: {
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
          },

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
            selection: {
              highlight: {
                type: 'single',
                empty: 'none',
                nearest: true,
                encodings: ['x'],
                on: 'mouseover',
                clear: 'mouseout',
              },
            },
            mark: {
              type: 'circle',
              tooltip: true,
            },
            encoding: {
              color: {
                condition: [
                  {
                    selection: 'range',
                    value: 'red',
                  },
                ],
                field: 'geo_value',
              },
              fillOpacity: {
                condition: [
                  {
                    selection: 'range',
                    value: 0.8,
                  },
                ],
                value: 0.5,
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

          // complicated construct to have proper typings
          ...(sensor.hasStdErr ? [stdErrLayer] : []),

          {
            transform: [
              {
                filter: {
                  selection: 'highlight',
                },
              },
            ],
            mark: {
              type: 'rule',
              strokeOpacity: 0.3,
            },
            encoding: {
              y: {
                field: primaryValue,
                type: 'quantitative',
              },
            },
          },

          {
            transform: [
              {
                filter: {
                  selection: 'range',
                },
              },
              {
                joinaggregate: [
                  {
                    op: 'min',
                    field: 'date_value',
                    as: 'left',
                  },
                  {
                    op: 'max',
                    field: 'date_value',
                    as: 'right',
                  },
                  // The argmin and argmax values accumulate, unfortunately.
                  // Otherwise, we could use in encoding with: { field: `min_datum['${primaryValue}']` },
                  // {
                  //   op: 'argmin',
                  //   field: 'date_value',
                  //   as: 'min_datum',
                  // },
                  // {
                  //   op: 'argmax',
                  //   field: 'date_value',
                  //   as: 'max_datum',
                  // },
                ],
              },
            ],

            layer: [
              {
                mark: {
                  type: 'rect',
                  fill: 'red',
                  fillOpacity: 0.05,
                  strokeWidth: 2,
                  stroke: 'black',
                  opacity: 0.5,
                  strokeOpacity: 1,
                },
                encoding: {
                  x: {
                    field: 'left',
                    type: 'temporal',
                  },
                  x2: {
                    field: 'right',
                    type: 'temporal',
                  },
                  y: {
                    aggregate: { argmin: 'date_value' },
                    field: primaryValue,
                    type: 'quantitative',
                  },
                  y2: {
                    aggregate: { argmax: 'date_value' },
                    field: primaryValue,
                    type: 'quantitative',
                  },
                },
              },
              // These marks accumulate.
              // {
              //   mark: { type: 'rule', opacity: 0.1, size: 3 },
              //   encoding: {
              //     x: { field: 'left' },
              //   },
              // },
              // {
              //   mark: { type: 'rule', opacity: 0.1, size: 3 },
              //   encoding: {
              //     x: { field: 'right' },
              //   },
              // },
              {
                mark: { type: 'rule', stroke: 'green', opacity: 0.1, size: 3 },
                encoding: {
                  x: null,
                  y: {
                    aggregate: { argmin: 'date_value' },
                    field: primaryValue,
                    type: 'quantitative',
                  },
                },
              },
              {
                mark: { type: 'rule', stroke: 'green', opacity: 0.1, size: 3 },
                encoding: {
                  x: null,
                  y: {
                    aggregate: { argmax: 'date_value' },
                    field: primaryValue,
                    type: 'quantitative',
                  },
                },
              },
              {
                // transform: [
                //   {
                //     // Using this accumulates values
                //     joinaggregate: [
                //       {
                //         op: 'argmin',
                //         field: 'date_value',
                //         as: 'leftData',
                //       },
                //     ],
                //   },
                // ],
                mark: {
                  type: 'text',
                  fontSize: 14,
                  dx: -40,
                  dy: -18,
                },
                encoding: {
                  x: {
                    field: 'left',
                  },
                  y: {
                    aggregate: { argmin: 'date_value' },
                    field: primaryValue,
                    type: 'quantitative',
                  },
                  text: {
                    aggregate: { argmin: 'date_value' },
                    field: primaryValue,
                  },
                },
              },
              {
                mark: {
                  type: 'text',
                  fontSize: 14,
                  dx: 40,
                  dy: 18,
                },
                encoding: {
                  x: {
                    field: 'right',
                  },
                  y: {
                    aggregate: { argmax: 'date_value' },
                    field: primaryValue,
                    type: 'quantitative',
                  },
                  text: {
                    aggregate: { argmax: 'date_value' },
                    field: primaryValue,
                  },
                },
              },
            ],
          },
          {
            transform: [
              {
                filter: {
                  selection: 'highlight',
                },
              },
            ],
            mark: {
              type: 'rule',
              strokeOpacity: 0.3,
            },
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
