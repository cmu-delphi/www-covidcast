import { dsvFormat } from 'd3-dsv';
import relatedCountiesRaw from './processed/related_counties.csv.js';
import { getInfoByName } from './infos';

const lookup = new Map();
dsvFormat(';')
  .parse(relatedCountiesRaw)
  .forEach((row) => {
    const id = row.id;
    lookup.set(
      row.id,
      row.related.split(',').map((related) => {
        // TOTAL length of id, if less then they are in common
        return id.slice(0, id.length - related.length) + related;
      }),
    );
  });

/**
 *
 * @param {import('./infos.js').NameInfo} info
 * @returns {import('./infos.js').NameInfo[]}
 */
export default function getRelatedCounties(info) {
  const related = lookup.get(info.id);
  if (!related) {
    return [];
  }
  return related.map((d) => getInfoByName(d));
}
