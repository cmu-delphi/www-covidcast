export function generateLineChartSpec(title, smartPadding = true) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    title,
    height: 300,
    padding: { left: 50, top: 6, bottom: 20, right: 2 },
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
            field: 'value',
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
              padding: smartPadding
                ? {
                    // in case the values are close to 0 .. no padding otherwise some padding
                    // if range.min < 10 && range.range > 30 ? 0 : 20
                    expr: `customObjChecks(customExtent(data("values"), "value"), ['min', '<', 10], ['range', '>', 30]) ? 0 : 20`,
                  }
                : 0,
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
            encodings: ['x'],
            clear: 'mouseout',
          },
        },
        mark: {
          type: 'point',
          stroke: null,
          fill: 'steelblue',
          tooltip: true,
        },
        encoding: {
          y: {
            field: 'value',
            type: 'quantitative',
          },
        },
      },
      {
        mark: {
          type: 'rule',
        },
        encoding: {
          opacity: {
            condition: [
              {
                selection: 'highlight',
                value: 1,
              },
            ],
            value: 0,
          },
          y: {
            field: 'value',
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
      axis: {
        // labelFont: 20,
        // tickMinStep: 10,
      },
      title: {
        anchor: 'start',
        fontWeight: 'normal',
        fontSize: 32,
      },
    },
  };
  return spec;
}
