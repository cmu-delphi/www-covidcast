import { updateHash } from '../../stores/urlHandler';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export interface IState {
  title?: string;
  order: string[];
  states: Record<string, Record<string, unknown>>;
  configs: Record<string, Record<string, unknown>>;
}

const BASE_STATE: IState = {
  order: ['trend_1', 'map_2', 'regiontable_3', 'datetable_4', 'line_5'],
  states: {
    line_5: { width: 4, height: 2, zero: true, raw: false },
    datetable_4: { width: 2, height: 4, sortCriteria: 'name', sortCriteriaDesc: true },
    regiontable_3: { width: 2, height: 4, sortCriteria: 'name', sortCriteriaDesc: true },
  },
  configs: {
    map_2: {
      level: 'state',
    },
  },
};

export function resolveInitialState(): IState {
  if (!location.hash) {
    return BASE_STATE;
  }
  try {
    const s = JSON.parse(decompressFromEncodedURIComponent(location.hash.slice(1))!) as unknown as IState;
    return {
      ...BASE_STATE,
      ...s,
    };
  } catch {
    console.error('invalid state in hash');
    return BASE_STATE;
  }
}

export function updateState(state: IState): void {
  updateHash(compressToEncodedURIComponent(JSON.stringify(state)));
}
