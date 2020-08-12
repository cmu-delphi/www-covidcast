// Node script to compress the values in the given JSON for smaller bundle size

const { dsvFormat } = require('d3');
const fs = require('fs');
const path = require('path');
const { topology } = require('topojson-server');

const QUANTIZATION = 1e4;

const data = require('./nameIdInfo/name_id_info.json');
const rows = data.all;

function states(level = 'state') {
  const geo = require(`../static/maps/new_states.json`);

  const infos = geo.features.map((feature) => {
    const id = feature.properties.STATE;
    const props = feature.properties;
    feature.id = id;
    feature.properties = {};
    return {
      id,
      postal: props.POSTAL,
      name: props.NAME,
      population: Number.parseInt(props.Population, 10),
      lat: props.LAT,
      long: props.LONG,
    };
  });
  const topo = topology({ [level]: geo }, QUANTIZATION);
  fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.geojson.json`), JSON.stringify(topo));
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/${level}.csv`),
    dsvFormat(',').format(infos, ['id', 'postal', 'name', 'population', 'lat', 'long']),
  );
}

function msa(level = 'msa') {
  // const properties = {
  //   csafp: null,
  //   cbsafp: '22380',
  //   affgeoid: '310M200US22380',
  //   geoid: '22380',
  //   NAME: 'Flagstaff, AZ',
  //   lsad: 'M1',
  //   aland: 48222462009,
  //   awater: 109964003,
  //   cartodb_id: 132,
  //   created_at: '2015-03-23T13:36:50Z',
  //   updated_at: '2015-03-23T13:36:50Z',
  //   Population: '143476',
  // };
  const geo = require(`../static/maps/new_${level}.json`);

  // const center = {
  //   type: 'Feature',
  //   geometry: { type: 'Point', coordinates: [-12.145786670984238, -1.8446709502002365] },
  //   properties: { NAME: 'Flagstaff, AZ', GEO_ID: '22380', id: '22380', Population: 143476 },
  // };
  const centers = require(`../static/maps/${level}_centers.json`).features;
  const centerById = new Map(centers.map((d) => [d.properties.id, d]));

  const infos = geo.features.map((feature) => {
    const id = feature.properties.geoid;
    const props = feature.properties;
    feature.id = id;
    feature.properties = {};
    const center = centerById.get(id);
    return {
      id,
      name: props.NAME,
      population: Number.parseInt(props.Population, 10),
      lat: center.geometry.coordinates[0],
      long: center.geometry.coordinates[1],
    };
  });
  const topo = topology({ states: geo }, QUANTIZATION);
  fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.geojson.json`), JSON.stringify(topo));
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/${level}.csv`),
    dsvFormat(',').format(infos, ['id', 'name', 'population', 'lat', 'long']),
  );
}

states();
msa();
