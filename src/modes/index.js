import mapIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/map.svg';
import timelapseIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/clock.svg';
import top10Icon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/list.svg';
import singleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/search-location.svg';
import exportIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/download.svg';

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
    icon: mapIcon,
    tooltip: 'Switch to the Map Overview',
    component: () => import(/* webpackPreload: true */ './overview/Overview.svelte').then((r) => r.default),
  },
  {
    id: 'timelapse',
    label: 'Timelapse',
    icon: timelapseIcon,
    tooltip: 'Switch to Timelapse Mode',
    component: () => import(/* webpackPrefech: true */ './timelapse/TimeLapse.svelte').then((r) => r.default),
  },
  {
    id: 'top10',
    label: 'Top 10',
    icon: top10Icon,
    tooltip: 'Switch to Top 10 Mode',
    component: () => import(/* webpackPrefetch: true */ './top10/Top10.svelte').then((r) => r.default),
  },
  {
    id: 'single',
    label: 'Region Details',
    icon: singleIcon,
    tooltip: 'Switch to Region Details View',
    component: () => import('./single/SingleLocation.svelte').then((r) => r.default),
  },
  {
    id: 'export',
    label: 'Export Data',
    icon: exportIcon,
    tooltip: 'Switch to Export Data Mode',
    component: () => import('./exportdata/ExportData.svelte').then((r) => r.default),
  },
];

export default modes;

/**
 * @type {Record<'overview'|'timelapse'|'top10'|'export'|'single', Mode>}
 */
export const modeByID = {};
modes.forEach((mode) => (modeByID[mode.id] = mode));
