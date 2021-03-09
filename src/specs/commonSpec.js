/**
 * @type {import('vega').Config}
 */
export const commonConfig = {
  customFormatTypes: true,
  font: '"Open Sans", Roboto, Arial, sans-serif',
  view: {
    stroke: null,
  },
};

/**
 *
 * @param {string} credits
 * @returns
 */
export function genCreditsLayer({ shift = 40 } = {}) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    data: {
      values: [
        {
          text: '',
        },
      ],
    },
    layer: [
      {
        mark: {
          type: 'rect',
          align: 'right',
          fill: 'white',
          x: {
            expr: 'width',
          },
          width: 200,
          y: {
            expr: `height + ${shift} - 5`,
          },
          height: 15,
        },
      },
      {
        mark: {
          type: 'text',
          align: 'right',
          baseline: 'bottom',
          x: {
            expr: 'width',
          },
          y: {
            expr: `height + ${shift}`,
          },
          text: 'Delphi Group, delphi.cmu.edu/covidcast',
        },
      },
    ],
  };
  return layer;
}
