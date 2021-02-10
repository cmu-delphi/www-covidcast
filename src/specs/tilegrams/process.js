// Node script to process the maps and info and generate an optimized version

const fs = require('fs');
const path = require('path');
const centerOfMass = require('@turf/center-of-mass').default;
const { feature } = require('topojson-client');

async function state() {
  const geo = require(`./tiles.topo.json`);
  
  const parsed = feature(geo, 'tiles').features;
  geo.objects.tiles.geometries.forEach((geo, i) => {
    const center = centerOfMass(parsed[i].geometry).geometry.coordinates;
    console.log(center);
    geo.properties.lat = center[1];
    geo.properties.lon = center[0];
    delete geo.properties.name;
  });
  fs.writeFileSync(path.resolve(__dirname, './state.topo.json'), JSON.stringify(geo));
}

(async function main() {
  await state();
})();
