import { dsvFormat } from 'd3-dsv';
import relatedCountiesRaw from './processed/related_counties.csv.js';
import { getInfoByName, RegionInfo } from './regions';

const lookup = (() => {
  const lookup = new Map<string, string[]>();
  dsvFormat(';')
    .parse(relatedCountiesRaw)
    .forEach((row) => {
      const id = row.id!;
      const ids = row.related!.split(',').map((related) => {
        // TOTAL length of id, if less then they are in common
        return id.slice(0, id.length - related.length) + related;
        // consider renames
      });
      lookup.set(id, ids);
    });
  return lookup;
})();

export default function getRelatedCounties(info: RegionInfo): RegionInfo[] {
  const related = lookup.get(info.id);
  if (!related) {
    return [];
  }
  return related.map((d) => getInfoByName(d, info.level)).filter((d): d is RegionInfo => d != null);
}
