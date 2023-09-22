import { writable, derived } from 'svelte/store';

export { currentRegionInfo, selectByInfo } from '../../stores';

export const dateOptions: { label: string; value: 'issue_date' | 'date_value' }[] = [
  { label: 'Reference Date', value: 'date_value' },
  { label: 'Reporting Date', value: 'issue_date' },
];

export const dateField = writable<'date_value' | 'issue_date'>('date_value');

export const dateLabel = derived([dateField], ([value]) => dateOptions.find((d) => d.value == value)!.label);

export const anchorLag = writable(60);

export const valueField = writable<
  'value_completeness' | 'value_rel_change' | 'sample_size_completeness' | 'sample_size_rel_change'
>('value_completeness');

export const valueOptions = derived([anchorLag], ([lag]) => [
  { label: `As fraction of value at lag ${lag}`, value: 'value_completeness' },
  { label: 'Day-to-day relative change', value: 'value_rel_change' },
  { label: `As fraction of sample size at lag ${lag}`, value: 'sample_size_completeness' },
  { label: 'Day-to-day relative sample size change', value: 'sample_size_rel_change' },
]);
export const valueLabel = derived(
  [valueField, valueOptions],
  ([value, options]) => options.find((d) => d.value == value)!.label,
);
export const isRelative = derived([valueField], ([v]) => v.endsWith('_rel_change'));

export const INACTIVE_DATA_SOURCES = ['dsew-cpr', 'fb-survey', 'jhu-csse', 'safegraph-weekly', 'usa-facts'];
