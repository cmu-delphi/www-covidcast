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
    component: () => import(/* webpackPreload: true */ './overview/Overview.svelte').then((r) => r.default),
  },
  {
    id: 'timelapse',
    label: 'Time-lapse',
    tooltip: 'Switch to Time-lapse Mode',
    component: () => import(/* webpackPrefech: true */ './timelapse/TimeLapse.svelte').then((r) => r.default),
  },
  // {
  //   id: 'hotspots',
  //   label: 'Hotspots',
  //   tooltip: 'Switch to Hotspots Mode',
  //   component: () => import(/* webpackPrefetch: true */ './hotspots/Hotspots.svelte').then((r) => r.default),
  // },
  // {
  //   id: 'swpa',
  //   label: 'SWPA',
  //   tooltip: 'Switch to SWPA Mode',
  //   component: () => import(/* webpackPrefetch: true */ './swpa/SWPA.svelte').then((r) => r.default),
  // },
];
