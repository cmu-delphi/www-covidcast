export function createSignalDateHighlight(signal, color) {
  /**
   * @type {import('vega-lite/build/src/spec').LayerSpec | import('vega-lite/build/src/spec').UnitSpec}
   */
  const layer = {
    description: 'shows the current data injected via a signal',
    data: {
      values: [{ date_value: null }],
    },
    transform: [
      {
        calculate: `toDate(${signal})`,
        as: 'date_value',
      },
    ],
    mark: {
      type: 'rule',
      tooltip: false,
    },
    encoding: {
      color: {
        value: color,
      },
      x: {
        field: 'date_value',
        type: 'temporal',
      },
    },
  };
  return layer;
}

export function createSignalPointHighlight(signal, shape = 'diamond', color = 'black') {
  /**
   * @type {import('vega-lite/build/src/spec').LayerSpec | import('vega-lite/build/src/spec').UnitSpec}
   */
  const layer = {
    description: 'shows the current data injected via a signal',
    data: {
      values: [{ date_value: null }],
    },
    transform: [
      {
        calculate: `toDate(${signal})`,
        as: 'date_value',
      },
    ],
    mark: {
      type: 'point',
      shape,
      color,
      fill: color,
      tooltip: false,
    },
    encoding: {
      y: {
        value: -7,
      },
      x: {
        field: 'date_value',
        type: 'temporal',
      },
    },
  };
  return layer;
}

export const CURRENT_DATE_HIGHLIGHT = createSignalDateHighlight('currentDate', '#c00');
export const CURRENT_DATE_ICON_HIGHLIGHT = createSignalPointHighlight('currentDate', 'circle', '#c00');
