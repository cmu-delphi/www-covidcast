export default function loadNameIdInfo() {
  return import('./name_id_info_compressed.json').then((mod) => {
    const raw = mod.default;
    /**
     * @type {{display_name: string, id: string, property_id: string, level: string}[]}
     */
    const data = [];

    // decompress the values again
    Object.keys(raw).forEach((level) => {
      const values = raw[level];
      for (const value of values) {
        // recreate old structure
        value.level = level;
        value.display_name = value.dname || value.id;
        delete value.dname;
        if (value.property_id == null) {
          value.property_id = value.id;
        }
        data.push(value);
      }
    });
    return data;
  });
}
