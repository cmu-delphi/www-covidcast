import { updateHash } from '../../stores/urlHandler';
import { compressToEncodedURIComponent } from 'lz-string';

export interface IState {
  x: number;
}

export function updateState(state: IState): void {
  updateHash(compressToEncodedURIComponent(JSON.stringify(state)));
}
