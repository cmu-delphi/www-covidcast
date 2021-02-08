export function patchHighlightTuple(current) {
  // patches the highlight signal,
  // see current.on[0].update
  const updateCode = current.on[0].update;
  current.on[0].update = `patchPickedItem(event) && item().${updateCode.replace(/ datum/, ' item().datum')}`;
  return current;
}

export const signalPatches = {
  highlight_tuple: patchHighlightTuple,
};

function smartPadding(valueField = 'value') {
  return {
    // in case the values are close to 0 .. no padding otherwise some padding
    // if range.min < 10 && range.range > 30 ? 0 : 20
    expr: `customObjChecks(customExtent(data("values"), "${valueField}"), ['min', '<', 10], ['range', '>', 30]) ? 0 : 20`,
  };
}

const AUTO_ALIGN = {
  // auto align based on remaining space
  expr:
    "(width - scale('x', datum.date_value)) < 40 ? 'right' : (scale('x', datum.date_value)) > 40 ? 'center' : 'left'",
};

export function generateLineChartSpec({ height = 300, initialDate = null, valueField = 'value' } = {}) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    height,
    padding: { left: 65, top: 16, bottom: 20, right: 10 },
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    data: {
      name: 'values',
    },
    encoding: {
      x: {
        field: 'date_value',
        type: 'temporal',
        axis: {
          title: null,
          grid: false,
          format: '%b %d',
          formatType: 'cachedTime',
          labelFontSize: 14,
          // tickCount: {
          //   interval: 'day',
          // },
        },
        scale: {},
      },
    },
    layer: [
      {
        mark: {
          type: 'line',
          point: false,
        },
        encoding: {
          y: {
            field: valueField,
            type: 'quantitative',
            axis: {
              grid: true,
              title: null,
              domain: false,
              tickCount: 5,
              labelFontSize: 14,
            },
            scale: {
              round: true,
              zero: false,
              domainMin: null,
              padding: smartPadding(valueField),
            },
          },
        },
      },
      {
        selection: {
          highlight: {
            type: 'single',
            empty: 'none',
            init: initialDate
              ? {
                  x: initialDate,
                }
              : undefined,
            on: 'click, [mousedown, window:mouseup] > mousemove, [touchstart, touchend] > touchmove',
            nearest: true,
            clear: false,
            encodings: ['x'],
          },
        },
        mark: {
          type: 'point',
          tooltip: true,
        },
        encoding: {
          y: {
            field: valueField,
            type: 'quantitative',
          },
          opacity: {
            condition: {
              selection: 'highlight',
              value: 1,
            },
            value: 0,
          },
        },
      },
      {
        transform: [
          {
            filter: {
              selection: 'highlight',
            },
          },
          {
            sample: 1,
          },
        ],
        mark: 'rule',
      },
      {
        transform: [
          {
            filter: {
              selection: 'highlight',
            },
          },
          {
            sample: 1,
          },
        ],
        mark: {
          type: 'text',
          align: AUTO_ALIGN,
          baseline: 'bottom',
          fontSize: 14,
          dy: -1,
        },
        encoding: {
          text: {
            field: 'date_value',
            type: 'temporal',
            format: '%b %d',
            formatType: 'cachedTime',
          },
          y: {
            value: 0,
          },
        },
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
          type: 'text',
          align: {
            // auto align based on remaining space
            expr: "(width - scale('x', datum.date_value)) < 40 ? 'right' : 'left'",
          },
          baseline: 'bottom',
          fontSize: 14,
          dx: {
            // auto align based on remaining space
            expr: "(width - scale('x', datum.date_value)) < 40 ? -2 : 2",
          },
          dy: -2,
        },
        encoding: {
          text: {
            field: valueField,
            type: 'quantitative',
            format: '.1f',
            formatType: 'cachedNumber',
          },
          y: {
            field: valueField,
            type: 'quantitative',
          },
        },
      },
    ],
    config: {
      customFormatTypes: true,
      view: {
        stroke: null,
      },
    },
  };
  return spec;
}

export function generateCompareLineSpec(compare, { compareField = 'displayName', ...options } = {}) {
  const spec = generateLineChartSpec(options);
  spec.padding.bottom = 50;
  spec.layer[0].encoding.color = {
    field: compareField,
    type: 'nominal',
    scale: {
      domain: compare,
    },
    legend: {
      direction: 'horizontal',
      orient: 'bottom',
      title: null,
      symbolType: 'stroke',
      symbolStrokeWidth: {
        expr: `datum.label === "${compare[0]}" ? 3 : 1`,
      },
    },
  };
  spec.layer[0].encoding.strokeWidth = {
    condition: {
      test: `datum['${compareField}'] === "${compare[0]}"`,
      value: 3,
    },
    value: 1,
  };
  spec.layer[1].encoding.color = {
    field: compareField,
    type: 'nominal',
  };
  return spec;
}
