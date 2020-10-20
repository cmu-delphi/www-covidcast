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
