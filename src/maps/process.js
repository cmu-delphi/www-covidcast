// Node script to process the maps and info and generate an optimized version

const { dsvFormat, csvParse } = require('d3-dsv');
const fs = require('fs');
const path = require('path');
const centerOfMass = require('@turf/center-of-mass').default;
const { topology } = require('topojson-server');
const bbox = require('@turf/bbox').default;
const { LngLatBounds, LngLat } = require('mapbox-gl');
const fetch = require('node-fetch');

const QUANTIZATION = 1e4;

const data = require('./raw/name_id_info.json');
const rows = data.all;

function computeBounds(geojson, scale = 1) {
  const bounds = bbox(geojson);

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
 * wraps the csv string to be like a JS module
 * @param {string} csv
 */
function wrapModule(csv) {
  return `export default \`${csv}\`;\n`;
}

async function states(level = 'state') {
  const populationLookup = await generatePopulationLookup();
  const geo = require(`./raw/new_states.json`);

  const infos = geo.features.map((feature) => {
    const id = feature.properties.STATE;
    const props = feature.properties;
    feature.id = id;
    feature.properties = {
      lat: props.LAT,
      long: props.LONG,
    };
    return {
      id,
      postal: props.POSTAL,
      name: props.NAME,
      population: populationLookup.state(id) || Number.parseInt(props.Population, 10),
    };
  });
  const extras = dsvFormat(';').parse(fs.readFileSync(path.join(__dirname, 'raw/territory/state.csv')).toString());
  for (const row of extras) {
    if (!row.population) {
      row.population = populationLookup.state(row.id);
    }
    infos.push(row);
  }
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/${level}.csv.js`),
    wrapModule(dsvFormat(';').format(infos, ['id', 'postal', 'name', 'population'])),
  );
  const topo = topology({ [level]: geo }, QUANTIZATION);
  fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.topojson.json`), JSON.stringify(topo));
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
    const center = centerById.get(id);
    feature.properties = {
      lat: center.geometry.coordinates[0],
      long: center.geometry.coordinates[1],
    };
    return {
      id,
      name: props.NAME,
      population: Number.parseInt(props.Population, 10),
    };
  });
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/${level}.csv.js`),
    wrapModule(dsvFormat(';').format(infos, ['id', 'name', 'population'])),
  );
  const topo = topology({ [level]: geo }, QUANTIZATION);
  fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.topojson.json`), JSON.stringify(topo));
  return geo;
}

async function generatePopulationLookup() {
  const csv = csvParse(
    await fetch(
      'https://raw.githubusercontent.com/cmu-delphi/covidcast-indicators/main/_delphi_utils_python/delphi_utils/data/fips_pop.csv',
    ).then((r) => r.text()),
  );
  const populationLookup = new Map(csv.map((r) => [r.fips, Number.parseInt(r.pop, 10)]));

  return {
    county: (fips) => populationLookup.get(fips),
    state: (fips) => populationLookup.get(fips + '000'),
  };
}

async function generateHRRPopulationLookup() {
  const lookup = await generatePopulationLookup();
  const fipsHRR = csvParse(
    await fetch(
      'https://raw.githubusercontent.com/cmu-delphi/covidcast-indicators/main/_delphi_utils_python/delphi_utils/data/fips_hrr_table.csv',
    ).then((r) => r.text()),
  );
  const populationHRRLookup = new Map();
  for (const row of fipsHRR) {
    const pop = lookup.county(row.fips);
    if (!pop) {
      continue;
    }
    const value = (populationHRRLookup.get(row.hrr) || 0) + pop * Number.parseFloat(row.weight);
    populationHRRLookup.set(row.hrr, Math.round(value));
  }
  return {
    ...lookup,
    hrr: (hrrID) => populationHRRLookup.get(hrrID),
  };
}

async function generateRelatedCounties() {
  const csv = dsvFormat('\t').parseRows(
    fs.readFileSync(path.join(__dirname, 'raw/adjacency/county_adjacency.txt')).toString(),
  );

  const r = new Map();
  let active = [];
  for (const row of csv) {
    const newCounty = row[0];
    if (newCounty) {
      active = [];
      r.set(row[1], active);
    }
    if (row[3]) {
      active.push(row[3]);
    }
  }

  function removeCommonPrefix(related, id) {
    let start = 0;
    while (related[start] === id[start] && start < related.length) {
      start++;
    }
    return related.slice(start);
  }

  const data = Array.from(r.entries()).map(([key, related]) => {
    // encode related skipping similar characters from the id
    return {
      id: key,
      related: related
        .filter((d) => d !== key)
        .map((d) => removeCommonPrefix(d, key))
        .join(','),
    };
  });
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/related_counties.csv.js`),
    wrapModule(dsvFormat(';').format(data, ['id', 'related'])),
  );

  return r;
}

async function counties(level = 'county') {
  const populationLookup = await generatePopulationLookup();
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

  const stateToPostal = new Map(
    require(`./raw/state_centers.json`).features.map((f) => [f.properties.STATE, f.properties.POSTAL]),
  );

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
    const center = centerById.get(id);
    feature.properties = {
      lat: center.geometry.coordinates[0],
      long: center.geometry.coordinates[1],
    };
    const info = infoById.get(id);
    const state = stateToPostal.get(props.STATE);
    const displayName = `${props.NAME} County, ${state}`;
    const alternativeDisplayName = `${props.NAME}, ${state}`;
    return {
      id,
      name: props.NAME,
      displayName:
        info && info.display_name !== displayName
          ? info.display_name === alternativeDisplayName
            ? 'X' // encode a C to indicate that it is a county without the county suffix
            : info.display_name
          : null,
      state,
      population: populationLookup.county(id) || Number.parseInt(props.Population, 10),
    };
  });

  const extras = dsvFormat(';').parse(fs.readFileSync(path.join(__dirname, 'raw/territory/county.csv')).toString());
  for (const row of extras) {
    if (!row.population) {
      row.population = populationLookup.state(row.id);
    }
    infos.push(row);
  }
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/${level}.csv.js`),
    wrapModule(dsvFormat(';').format(infos, ['id', 'name', 'population', 'displayName'])),
  );
  const topo = topology({ [level]: geo }, QUANTIZATION);
  fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.topojson.json`), JSON.stringify(topo));

  return geo;
}

async function hrr(level = 'hrr') {
  const populationLookup = await generateHRRPopulationLookup();
  const geo = require(`./raw/hrr/hrr.reprojected.geo.json`);

  const infos = geo.features
    .map((feature) => {
      const id = String(feature.properties.hrr_num);
      // due to some unknown error in the re-projection,
      // frames covering the whole area are created within the geometry
      // each frame has the same first coordinate pair which is used to filter it out
      const MAGIC_FRAME_FIST_COORDINATE_PAIR = [-26.069579678452456, 13.509452429458069];
      feature.geometry.coordinates = feature.geometry.coordinates.filter((d) => {
        // keep only lists which are not starting with the magic frame pair
        return !(
          d[0][0][0] === MAGIC_FRAME_FIST_COORDINATE_PAIR[0] && d[0][0][1] === MAGIC_FRAME_FIST_COORDINATE_PAIR[1]
        );
      });
      delete feature.bbox;
      const center = centerOfMass(feature).geometry.coordinates;
      const props = feature.properties;
      const state = props.hrr_name.split('-')[0].trim();
      const name = props.hrr_name.slice(props.hrr_name.indexOf('-') + 1).trim();
      feature.id = id;
      feature.properties = {
        lat: center[0],
        long: center[1],
      };
      return {
        id,
        name,
        state,
        population: populationLookup.hrr(id),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(
    path.resolve(__dirname, `./processed/${level}.csv.js`),
    wrapModule(dsvFormat(';').format(infos, ['id', 'name', 'state', 'population'])),
  );
  // fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.geo.json`), JSON.stringify(geo));
  const topo = topology({ [level]: geo }, QUANTIZATION / 2.5);
  fs.writeFileSync(path.resolve(__dirname, `./processed/${level}.topojson.json`), JSON.stringify(topo));
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
    path.resolve(__dirname, `./processed/cities.csv.js`),
    wrapModule(dsvFormat(';').format(infos, ['name', 'population', 'lat', 'long'])),
  );
}

(async function main() {
  const statesGeo = await states();
  const msaGeo = await msa();
  const countiesGeo = await counties();
  const hrrGeo = await hrr();
  await cities();
  await generateRelatedCounties();

  fs.writeFileSync(
    path.resolve(__dirname, `./processed/bounds.json`),
    JSON.stringify(
      {
        states: computeBounds(statesGeo).toArray(),
        msa: computeBounds(msaGeo).toArray(),
        counties: computeBounds(countiesGeo).toArray(),
        hrr: computeBounds(hrrGeo).toArray(),
      },
      null,
      2,
    ),
  );
})();
