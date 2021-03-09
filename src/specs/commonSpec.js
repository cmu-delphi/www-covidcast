/**
 *
 * @param {string} credits
 * @returns
 */
export function genCreditsLayer() {
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
            expr: 'width-100',
          },
          width: 100,
          y: {
            expr: 'height-30',
          },
          height: 30,
        },
      },
      {
        mark: {
          type: 'text',
          align: 'right',
          x: {
            expr: 'width',
          },
          y: {
            expr: 'height',
          },
          text: 'Data from Delphi COVIDcast, covidcast.cmu.edu',
        },
      },
    ],
  };
  return layer;
}
