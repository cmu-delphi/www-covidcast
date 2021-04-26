import { updateHash } from '../../stores/urlHandler';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export interface IState {
  order: string[];
  states: Record<string, Record<string, unknown>>;
  configs: Record<string, Record<string, unknown>>;
}

const BASE_STATE: IState = {
  order: ['line_1', 'datetable_2', 'datepcp_3'],
  states: {},
  configs: {},
};

export function resolveInitialState(): IState {
  if (!location.hash) {
    return BASE_STATE;
  }
  try {
    const s = (JSON.parse(decompressFromEncodedURIComponent(location.hash.slice(1))!) as unknown) as IState;
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
