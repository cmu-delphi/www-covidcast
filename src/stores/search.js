import { writable, derived } from 'svelte/store';
import loadNameIdInfo from '../maps/nameIdInfo';
import { levelMegaCounty } from './constants';

/**
 * @type {import('svelte/store').Writable<import('../maps/nameIdInfo').NameInfo[]>}
 */
export const regionSearchList = writable([], (set) => {
  loadNameIdInfo().then((r) => {
    // generate mega counties by copying the states
    r.filter((d) => d.level === 'state').forEach((elem) => {
      r.push(elem.id + '000', {
        id: elem.id + '000',
        display_name: `Rest of ${elem.display_name}`,
        level: levelMegaCounty.id,
        name: `Rest of ${elem.name}`,
        property_id: elem.id + '000',
      });
    });
    set(r);
  });
});

/**
 * helper to resolve a given id to a name info object
 */
export const regionSearchLookup = derived([regionSearchList], ([regions]) => {
  const map = new Map(regions.map((d) => [String(d.property_id).toLowerCase(), d]));
  // also by id lookup
  regions.forEach((region) => {
    const key = String(region.id).toLowerCase();
    if (!map.has(key)) {
      map.set(key, region);
    }
  });

  return (id) => map.get(String(id).toLowerCase());
});
