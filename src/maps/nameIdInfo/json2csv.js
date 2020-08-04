// Node script to compress the values in the given JSON for smaller bundle size

const { dsvFormat } = require('d3');
const data = require('./name_id_info.json');
const fs = require('fs');
const rows = data.all;

const out = dsvFormat(';').formatRows([
  ['id', 'name', 'level', 'property_id', 'display_name'],
  ...rows.map((row) => [
    row.id,
    row.name,
    row.level,
    row.property_id === row.id ? '' : row.property_id,
    row.display_name === row.name ? '' : row.display_name,
  ]),
]);

fs.writeFileSync('./name_id_info.csv', out);
