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
    id: 'classic',
    label: 'Classic COVIDcast',
    component: () => import(/* webpackChunkName: 'm-old' */ './classic/Overview.svelte').then((r) => r.default),
  },
  {
    id: 'survey-results',
    label: 'Survey Results',
    component: () =>
      import(/* webpackChunkName: 'm-survey' */ './survey-results/SurveyResults.svelte').then((r) => r.default),
  },
  {
    id: 'export',
    label: 'Export Data',
    component: () => import(/* webpackChunkName: 'm-export' */ './exportdata/ExportData.svelte').then((r) => r.default),
  },
  // {
  //   id: 'lab',
  //   label: 'Lab',
  //   component: () => import(/* webpackChunkName: 'mode-lab' */ './lab/Lab.svelte').then((r) => r.default),
  // },
  {
    id: 'indicator-status',
    label: 'Indicator Status Overview',
    component: () =>
      import(/* webpackChunkName: 'm-indicator-status' */ './indicator-status/IndicatorStatusOverview.svelte').then(
        (r) => r.default,
      ),
  },
  {
    id: 'data-anomalies',
    label: 'Data Anomalies',
    component: () =>
      import(/* webpackChunkName: 'm-data-anomalies' */ './data-anomalies/DataAnomalies.svelte').then((r) => r.default),
  },
  {
    id: 'dashboard',
    label: 'Dashboard Builder',
    component: () =>
      import(/* webpackChunkName: 'm-databoard' */ './dashboard/Dashboard.svelte').then((r) => r.default),
    waitForReady: true,
  },
];
