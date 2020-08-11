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
export default [
  {
    id: 'overview',
    label: 'Overview',
    tooltip: 'Switch to Overview Mode',
    component: () => import('./overview/Overview.svelte').then((r) => r.default),
  },
  {
    id: 'history',
    label: 'History',
    tooltip: 'Switch to History Mode',
    component: () => import('./history/History.svelte').then((r) => r.default),
  },
  // {
  //   id: 'compare',
  //   label: 'Compare',
  //   tooltip: 'Switch to Comparison Mode',
  //   component: () => import('./compare/Compare.svelte').then((r) => r.default),
  // },
  // {
  //   id: 'hotspots',
  //   label: 'Hotspots',
  //   tooltip: 'Switch to Hotspots Mode',
  //   component: () => import('./hotspots/Hotspots.svelte').then((r) => r.default),
  // },
];
