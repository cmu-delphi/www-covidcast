/**
 * @typedef {object} Mode
 * @property {string} id
 * @property {string} label
 * @property {string} tooltip
 * @property {Promise<any>} component
 */

/**
 * @type {Mode[]}
 */
const modes = [
  {
    id: 'overview',
    label: 'Map Overview',
    tooltip: 'Switch to the Map Overview',
    component: () => import(/* webpackPreload: true */ './overview/Overview.svelte').then((r) => r.default),
  },
  {
    id: 'timelapse',
    label: 'Timelapse',
    tooltip: 'Switch to Timelapse Mode',
    component: () => import(/* webpackPrefech: true */ './timelapse/TimeLapse.svelte').then((r) => r.default),
  },
  {
    id: 'top10',
    label: 'Top 10',
    tooltip: 'Switch to Top 10 Mode',
    component: () => import(/* webpackPrefetch: true */ './top10/Top10.svelte').then((r) => r.default),
  },
  {
    id: 'single',
    label: 'Single Location',
    tooltip: 'Switch to Single Location View',
    component: () => import('./single/SingleLocation.svelte').then((r) => r.default),
  },
  {
    id: 'export',
    label: 'Export Data',
    tooltip: 'Switch to Export Data Mode',
    component: () => import('./exportdata/ExportData.svelte').then((r) => r.default),
  },
  // {
  //   id: 'swpa',
  //   label: 'SWPA',
  //   tooltip: 'Switch to SWPA Mode',
  //   component: () => import(/* webpackPrefetch: true */ './swpa/SWPA.svelte').then((r) => r.default),
  // },
];

export default modes;

/**
 * @type {Record<'overview'|'timelapse'|'top10'|'export', Mode>}
 */
export const modeByID = {};
modes.forEach((mode) => (modeByID[mode.id] = mode));
