import type { View } from 'vega';
import isEqual from 'lodash-es/isEqual';
import type { WidgetHighlight } from '../highlight';

export function joinLabels(labels: string[], defaultLabel = 'Regions') {
  if (labels.length === 0) {
    return defaultLabel;
  }
  if (labels.length === 1) {
    return labels[0];
  }
  const r = labels.slice(0, labels.length - 1).join(', ');
  return `${r} and ${labels[labels.length - 1]}`;
}

export function highlightToDate(highlight?: WidgetHighlight | null) {
  return highlight ? highlight.primaryDate : null;
}

export function updateVegaHighlight(vegaRef: { vegaDirectAccessor: () => View }, highlight?: WidgetHighlight | null) {
  if (!vegaRef) {
    return;
  }
  const view = vegaRef.vegaDirectAccessor();
  if (!view) {
    return;
  }
  const value = highlightToDate(highlight);
  const values = value ? [value.getTime()] : null;
  const newValue = value
    ? {
        unit: 'layer_1',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        fields: view.signal('highlight_tuple_fields'),
        values,
      }
    : null;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const currentValues = (view.signal('highlight_tuple') || { values: [] }).values as unknown[];
  const newValues = values || [];
  if (isEqual(currentValues, newValues)) {
    return;
  }
  view.signal('highlight_tuple', newValue);
  void view.runAsync();
}
