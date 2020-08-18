import { derived, readable } from 'svelte/store';
import { nameInfos } from '../maps';

/**
 * @type {import('svelte/store').Readable<import('../maps').NameInfo[]>}
 */
export const regionSearchList = readable(nameInfos);

/**
 * helper to resolve a given id to a name info object
 */
export const regionSearchLookup = derived([regionSearchList], ([regions]) => {
  const map = new Map(regions.map((d) => [String(d.propertyId).toLowerCase(), d]));
  // also by id lookup
  regions.forEach((region) => {
    const key = String(region.id).toLowerCase();
    if (!map.has(key)) {
      map.set(key, region);
    }
  });

  return (id) => map.get(String(id).toLowerCase());
});
