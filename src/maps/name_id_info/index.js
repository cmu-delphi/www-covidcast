import { dsvFormat } from 'd3';

export default function loadNameIdInfo() {
  return import('./name_id_info.csv').then((mod) => {
    /**
     * @type string
     */
    const raw = mod.default;
    /**
     * @type {{name: string; display_name: string, id: string, property_id: string, level: string}[]}
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
