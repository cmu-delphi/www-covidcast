// Node script to compress the values in the given JSON for smaller bundle size

const data = require('./name_id_info.json');
const fs = require('fs');
const rows = data.all;

// delete redundant elements
rows.forEach((row) => {
  const d = row.display_name;
  delete row.display_name;
  if (d !== row.name) {
    row.dname = d;
  }
  if (row.property_id === row.id) {
    delete row.property_id;
  }
});
// group by level
const groups = new Map();
rows.forEach((row) => {
  if (!groups.has(row.level)) {
    groups.set(row.level, []);
  }
  const level = row.level;
  delete row.level;
  groups.get(level).push(row);
});

const dataNew = {};
groups.forEach((values, level) => (dataNew[level] = values));

fs.writeFileSync('./name_id_info_compressed.json', JSON.stringify(dataNew, null, 2));
