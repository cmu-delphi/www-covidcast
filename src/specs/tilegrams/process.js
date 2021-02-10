// Node script to process the maps and info and generate an optimized version

const fs = require('fs');
const path = require('path');
const centerOfMass = require('@turf/center-of-mass').default;
const dissolve = require('@turf/dissolve');
const combine = require('@turf/combine').default;
const { feature } = require('topojson-client');
const { topology } = require('topojson-server');

async function state() {
  const geo = require(`./tiles.topo.json`);
  
  const parsed = feature(geo, 'tiles');
  geo.objects.tiles.geometries.forEach((geo, i) => {
    const center = centerOfMass(parsed.features[i].geometry).geometry.coordinates;
    geo.properties.lat = center[1];
    geo.properties.lon = center[0];
    delete geo.properties.name;
  });
  fs.writeFileSync(path.resolve(__dirname, './state.topo.json'), JSON.stringify(geo));

  const nation = combine(dissolve(dissolve(dissolve(dissolve(parsed)))));
  delete nation.features[0].properties;
  nation.features[0].id = 'us';
  const nationTopo = topology({nation});
  fs.writeFileSync(path.resolve(__dirname, './nation.topo.json'), JSON.stringify(nationTopo));

}

(async function main() {
  await state();
})();
