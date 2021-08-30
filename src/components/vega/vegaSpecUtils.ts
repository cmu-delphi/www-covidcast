import type { NormalizedUnitSpec } from 'vega-lite/build/src/spec';

export function createSignalDateHighlight(signal: string, color: string): NormalizedUnitSpec {
  return {
    description: 'shows the current data injected via a signal',
    data: {
      values: [{ date_value: null, week_value: null }],
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
}

export function createSignalPointHighlight(signal: string, shape = 'diamond', color = 'black'): NormalizedUnitSpec {
  return {
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
}

export const CURRENT_DATE_HIGHLIGHT = createSignalDateHighlight('currentDate', '#c00');
export const CURRENT_DATE_ICON_HIGHLIGHT = createSignalPointHighlight('currentDate', 'circle', '#c00');
