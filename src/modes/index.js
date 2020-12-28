/**
 * @typedef {object} Mode
 * @property {string} id
 * @property {string} label
 * @property {Promise<any>} component
 */

/**
 * @type {Mode[]}
 */
const modes = [
  {
    id: 'overview',
    label: 'Map Overview',
    component: () => import('./overview/Overview.svelte').then((r) => r.default),
  },
  {
    id: 'timelapse',
    label: 'Timelapse',
    component: () => import('./timelapse/TimeLapse.svelte').then((r) => r.default),
  },
  {
    id: 'top10',
    label: 'Top 10',
    component: () => import('./top10/Top10.svelte').then((r) => r.default),
  },
  {
    id: 'single',
    label: 'Region Details',
    component: () => import('./single/SingleLocation.svelte').then((r) => r.default),
  },
  {
    id: 'survey-results',
    label: 'Survey Results',
    component: () => import('./survey/Survey.svelte').then((r) => r.default),
  },
  {
    id: 'export',
    label: 'Export Data',
    component: () => import('./exportdata/ExportData.svelte').then((r) => r.default),
  },
];

export default modes;

/**
 * @type {Record<'overview'|'timelapse'|'top10'|'export'|'single'|'survey-results', Mode>}
 */
export const modeByID = {};
modes.forEach((mode) => (modeByID[mode.id] = mode));
