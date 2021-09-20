/**
 * @type {import('./index').Mode[]}
 */
export const modes = [
  {
    id: 'landing',
    label: 'COVIDcast Overview',
    component: () => import(/* webpackChunkName: 'm-landing' */ './landing/Landing.svelte').then((r) => r.default),
  },
  {
    id: 'summary',
    label: 'Location Summary',
    component: () => import(/* webpackChunkName: 'm-overview' */ './summary/Summary.svelte').then((r) => r.default),
  },
  {
    id: 'indicator',
    label: 'Indicator Details',
    component: () =>
      import(/* webpackChunkName: 'm-indicator' */ './indicator/Indicator.svelte').then((r) => r.default),
  },
  {
    id: 'correlation',
    label: 'Indicator Correlation',
    component: () =>
      import(/* webpackChunkName: 'm-correlation' */ './correlation/Correlation.svelte').then((r) => r.default),
  },
  {
    id: 'survey-results',
    label: 'CTIS Results',
    component: () =>
      import(/* webpackChunkName: 'm-survey' */ './survey-results/SurveyResults.svelte').then((r) => r.default),
  },
  {
    id: 'export',
    label: 'Export Data',
    isGeneric: true,
    component: () => import(/* webpackChunkName: 'm-export' */ './exportdata/ExportData.svelte').then((r) => r.default),
  },
  {
    id: 'indicator-status',
    label: 'Indicator Status Overview',
    isGeneric: true,
    component: () =>
      import(/* webpackChunkName: 'm-indicator-status' */ './indicator-status/IndicatorStatusOverview.svelte').then(
        (r) => r.default,
      ),
  },
  {
    id: 'indicator-source',
    label: 'Indicator Source',
    isGeneric: true,
    component: () =>
      import(/* webpackChunkName: 'm-indicator-source' */ './indicator-status/IndicatorSource.svelte').then(
        (r) => r.default,
      ),
  },
  {
    id: 'indicator-signal',
    label: 'Indicator Signal',
    isGeneric: true,
    component: () =>
      import(/* webpackChunkName: 'm-indicator-signal' */ './indicator-status/IndicatorSignal.svelte').then(
        (r) => r.default,
      ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard Builder',
    isGeneric: true,
    component: () =>
      import(/* webpackChunkName: 'm-dashboard' */ './dashboard/Dashboard.svelte').then((r) => r.default),
  },
];
