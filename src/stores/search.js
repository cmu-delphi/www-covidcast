import { writable } from 'svelte/store';
import loadNameIdInfo from '../maps/nameIdInfo';

/**
 * @type {import('svelte/store').Writable<import('../maps/nameIdInfo').NameInfo[]>}
 */
export const regionSearchList = writable([], (set) => {
  loadNameIdInfo().then((r) => set(r));
});
