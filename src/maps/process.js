// Node script to process the maps and info and generate an optimized version

const { dsvFormat } = require('d3');
const fs = require('fs');
const path = require('path');
const { topology } = require('topojson-server');
const geojsonExtent = require('@mapbox/geojson-extent');
const { LngLatBounds, LngLat } = require('mapbox-gl');

const QUANTIZATION = 1e4;

const data = require('./raw/name_id_info.json');
const rows = data.all;

function computeBounds(geojson, scale = 1.2) {
  const bounds = geojsonExtent(geojson);

  const mapglBounds = new LngLatBounds(new LngLat(bounds[0], bounds[1]), new LngLat(bounds[2], bounds[3]));

  if (scale === 1) {
    return mapglBounds;
  }

  const widthLng = bounds[2] - bounds[0];
  const heightLat = bounds[3] - bounds[1];

  const center = mapglBounds.getCenter();
  const targetWidth = widthLng * scale;
  const targetHeight = heightLat * scale;

  return new LngLatBounds(
    new LngLat(center.lng + targetWidth / 2, center.lat - targetHeight / 2),
    new LngLat(center.lng - targetWidth / 2, center.lat + targetHeight / 2),
  );
}

/**
 *
 * @param {LngLatBounds} boundsA
 * @param {LngLatBounds} boundsB
 */
function overlaps(boundsA, boundsB) {
  if (boundsA.getEast() > boundsB.getWest() || boundsA.getWest() < boundsB.getEast()) {
    return false;
  }
  if (boundsA.getSouth() > boundsB.getNorth() || boundsA.getNorth() < boundsB.getSouth()) {
    return false;
  }
  return true;
}

function states(level = 'state') {
  const geo = require(`./raw/new_states.json`);

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
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/${level}.csv`),
    dsvFormat(',').format(infos, ['id', 'postal', 'name', 'population', 'lat', 'long']),
  );
  const topo = topology({ [level]: geo }, QUANTIZATION);
  fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.geojson.json`), JSON.stringify(topo));
  return geo;
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
  const geo = require(`./raw/new_msa.json`);

  // const center = {
  //   type: 'Feature',
  //   geometry: { type: 'Point', coordinates: [-12.145786670984238, -1.8446709502002365] },
  //   properties: { NAME: 'Flagstaff, AZ', GEO_ID: '22380', id: '22380', Population: 143476 },
  // };
  const centers = require(`./raw/msa_centers.json`).features;
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
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/${level}.csv`),
    dsvFormat(',').format(infos, ['id', 'name', 'population', 'lat', 'long']),
  );
  const topo = topology({ [level]: geo }, QUANTIZATION);
  fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.geojson.json`), JSON.stringify(topo));
  return geo;
}

function counties(level = 'county') {
  //{
  //   "display_name": "Valdez-Cordova County, AK",
  //   "name": "Valdez-Cordova",
  //   "id": "02261",
  //   "property_id": "02261",
  //   "level": "county"
  // },
  const infoById = new Map(rows.filter((d) => d.level === level).map((d) => [d.id, d]));
  // const properties = {
  //   GEO_ID: '0500000US02261',
  //   STATE: '02',
  //   COUNTY: '261',
  //   NAME: 'Valdez-Cordova',
  //   LSAD: 'CA',
  //   CENSUSAREA: 34239.88,
  //   Population: '9202',
  // };
  const geo = require(`./raw/new_counties.json`);

  // const center = {
  //   type: 'Feature',
  //   geometry: { type: 'Point', coordinates: [-15.707827062813598, -10.343262810086836] },
  //   properties: {
  //     NAME: 'Valdez-Cordova',
  //     GEO_ID: '0500000US02261',
  //     STATE: '02',
  //     COUNTY: '261',
  //     id: '02261',
  //     Population: 9202,
  //   },
  // };
  const centers = require(`./raw/county_centers.json`).features;
  const centerById = new Map(centers.map((d) => [d.properties.id, d]));

  const infos = geo.features.map((feature) => {
    const id = feature.properties.GEO_ID.slice(-5);
    const props = feature.properties;
    feature.id = id;
    feature.properties = {};
    const center = centerById.get(id);
    const info = infoById.get(id);
    return {
      id,
      name: props.NAME,
      displayName: info ? info.display_name : `${props.NAME} County, ${props.LSAD}`,
      state: props.STATE,
      population: Number.parseInt(props.Population, 10),
      lat: center.geometry.coordinates[0],
      long: center.geometry.coordinates[1],
    };
  });
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/${level}.csv`),
    dsvFormat(',').format(infos, ['id', 'name', 'displayName', 'state', 'population', 'lat', 'long']),
  );
  const topo = topology({ [level]: geo }, QUANTIZATION);
  fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.geojson.json`), JSON.stringify(topo));
  return geo;
}

function cities() {
  const geo = require(`./raw/city_data/cities-reprojected.json`);
  const infos = geo.features.map((feature) => {
    const props = feature.properties;
    return {
      name: props.city,
      population: props.population,
      lat: feature.geometry.coordinates[0],
      long: feature.geometry.coordinates[1],
    };
  });
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/cities.csv`),
    dsvFormat(',').format(infos, ['name', 'population', 'lat', 'long']),
  );
}

const statesGeo = states();
const msaGeo = msa();
const countiesGeo = counties();
cities();

fs.writeFileSync(
  path.resolve(__dirname, `./processed/bounds.json`),
  JSON.stringify(
    {
      states: computeBounds(statesGeo).toArray(),
      msa: computeBounds(msaGeo).toArray(),
      counties: computeBounds(countiesGeo).toArray(),
    },
    null,
    2,
  ),
);

{
  const zone = require(`./raw/swpa/hrr_zone.json`);
  const topo = topology({ zone }, QUANTIZATION);
  fs.writeFileSync(path.resolve(__dirname, `./processed/swpa/zone.geojson.json`), JSON.stringify(topo));
  const bounds = computeBounds(zone, 1);

  Object.entries({
    state: statesGeo,
    msa: msaGeo,
    county: countiesGeo,
  }).forEach(([level, v]) => {
    const inZone = {
      type: 'FeatureCollection',
      features: v.features.filter((feature) => overlaps(bounds, computeBounds(feature, 1))),
    };
    const topo = topology({ [level]: inZone }, QUANTIZATION);
    fs.writeFileSync(path.resolve(__dirname, `./processed/swpa/${level}.geojson.json`), JSON.stringify(topo));
  });
}
