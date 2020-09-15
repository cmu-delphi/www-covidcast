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
  {
    id: 'screenshot-map',
    hidden: true,
    label: 'Internal Screenshot Mode',
    tooltip: 'Internal Screenshot mode',
    component: () => import('./screenshot/ScreenshotMap.svelte').then((r) => r.default),
  },
  {
    id: 'screenshot-detail',
    hidden: true,
    label: 'Internal Screenshot Detail Mode',
    tooltip: 'Internal Screenshot mode',
    component: () => import('./screenshot/ScreenshotDetailView.svelte').then((r) => r.default),
  },
  {
    id: 'screenshot-panel',
    hidden: true,
    label: 'Internal Screenshot Panel Mode',
    tooltip: 'Internal Screenshot mode',
    component: () => import('./screenshot/ScreenshotDetailView.svelte').then((r) => r.default),
  },
  // {
  //   id: 'compare',
  //   label: 'Compare',
  //   tooltip: 'Switch to Comparison Mode',
  //   component: () => import(/* webpackPrefech: true */ './compare/Compare.svelte').then((r) => r.default),
  // },
  {
    id: 'top10',
    label: 'Top 10',
    tooltip: 'Switch to Top 10 Mode',
    component: () => import(/* webpackPrefetch: true */ './top10/Top10.svelte').then((r) => r.default),
  },
  // {
  //   id: 'swpa',
  //   label: 'SWPA',
  //   tooltip: 'Switch to SWPA Mode',
  //   component: () => import(/* webpackPrefetch: true */ './swpa/SWPA.svelte').then((r) => r.default),
  // },
];
