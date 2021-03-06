import { modes } from './modes';
export { modes } from './modes';

export interface Mode {
  id: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: () => Promise<any>;
  anchor?: string;
  waitForReady?: boolean;
}

export default modes;

export type ModeID =
  | 'summary'
  | 'export'
  | 'survey-results'
  | 'indicator'
  | 'landing'
  | 'indicator-status'
  | 'data-anomalies'
  | 'correlation'
  | 'dashboard';

export const modeByID: Record<ModeID, Mode> = (() => {
  const r: Record<string, Mode> = {};
  modes.forEach((mode) => (r[mode.id] = mode));
  return r;
})();
