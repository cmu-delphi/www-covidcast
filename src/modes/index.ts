export interface Mode {
  id: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: () => Promise<any>;
  anchor?: string;
}

const modes: Mode[] = [
  {
    id: 'landing',
    label: 'COVIDcast Overview',
    component: () => import(/* webpackChunkName: 'm-landing' */ './landing/Landing.svelte').then((r) => r.default),
  },
  {
    id: 'summary',
    label: 'Location Summary',
    component: () =>
      import(/* webpackChunkName: 'm-overview' */ './mobile/MobileOverview.svelte').then((r) => r.default),
  },
  {
    id: 'indicator',
    label: 'Indicator Details',
    component: () =>
      import(/* webpackChunkName: 'm-indicator' */ './mobile/MobileIndicatorOverview.svelte').then((r) => r.default),
  },
  {
    id: 'correlation',
    label: 'Indicator Correlation',
    component: () =>
      import(/* webpackChunkName: 'm-correlation' */ './correlation/IndicatorCorrelation.svelte').then(
        (r) => r.default,
      ),
  },
  {
    id: 'classic',
    label: 'Classic COVIDcast',
    component: () => import(/* webpackChunkName: 'm-old' */ './overview/Overview.svelte').then((r) => r.default),
  },
  // {
  //   id: 'timelapse',
  //   label: 'Timelapse',
  //   component: () =>
  //     import(/* webpackChunkName: 'm-timelapse' */ './timelapse/TimeLapse.svelte').then((r) => r.default),
  // },
  // {
  //   id: 'top10',
  //   label: 'Top 10',
  //   component: () => import(/* webpackChunkName: 'm-top10' */ './top10/Top10.svelte').then((r) => r.default),
  // },
  // {
  //   id: 'single',
  //   label: 'Region Details',
  //   component: () => import(/* webpackChunkName: 'm-single' */ './single/SingleLocation.svelte').then((r) => r.default),
  // },
  {
    id: 'survey-results',
    label: 'Survey Results',
    component: () => import(/* webpackChunkName: 'm-survey' */ './survey/Survey.svelte').then((r) => r.default),
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
];

export default modes;

export type ModeID =
  | 'summary'
  | 'timelapse'
  | 'top10'
  | 'export'
  | 'single'
  | 'survey-results'
  | 'lab'
  | 'classic'
  | 'indicator'
  | 'landing'
  | 'indicator-status'
  | 'correlation';

export const modeByID: Record<ModeID, Mode> = (() => {
  const r: Record<string, Mode> = {};
  modes.forEach((mode) => (r[mode.id] = mode));
  return r;
})();
