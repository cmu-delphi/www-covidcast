import { writable, derived } from 'svelte/store';

export { currentRegionInfo, selectByInfo } from '../../stores';

export const dateOptions: { label: string; value: 'issue_date' | 'date_value' }[] = [
  { label: 'Reported Date', value: 'date_value' },
  { label: 'Issue Date', value: 'issue_date' },
];

export const dateField = writable<'date_value' | 'issue_date'>('date_value');

export const dateLabel = derived([dateField], ([value]) => dateOptions.find((d) => d.value == value)!.label);

export const valueOptions = [
  { label: 'Value Completeness', value: 'value_completeness' },
  { label: 'Relative Value Change', value: 'value_rel_change' },
  { label: 'Sample Size Completeness', value: 'sample_size_completeness' },
  { label: 'Relative Sample Size Change', value: 'sample_size_rel_change' },
];
export const valueField = writable<
  'value_completeness' | 'value_rel_change' | 'sample_size_completeness' | 'sample_size_rel_change'
>('value_completeness');
export const valueLabel = derived([valueField], ([value]) => valueOptions.find((d) => d.value == value)!.label);

export const anchorLag = writable(60);

export const isRelative = derived([valueField], ([v]) => v.endsWith('_rel_change'));
