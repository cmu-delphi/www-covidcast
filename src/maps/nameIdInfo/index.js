import { dsvFormat } from 'd3';

/**
 * @typedef {object} NameInfo
 * @property {name_id_info} direction
 * @property {string} name name to search
 * @property {string} display_name name to show
 * @property {string} id ?
 * @property {string} property_id geojson: feature.property.id
 * @property {'state' | 'county' | 'msa'} level
 */

export default function loadNameIdInfo() {
  return import('./name_id_info.csv').then((mod) => {
    /**
     * @type string
     */
    const raw = mod.default;
    /**
     * @type {NameInfo[]}
     */
    const data = dsvFormat(';').parse(raw);

    // decompress the values again
    for (const row of data) {
      if (!row.display_name) {
        row.display_name = row.name;
      }
      if (!row.property_id) {
        row.property_id = row.id;
      }
    }
    return data;
  });
}
