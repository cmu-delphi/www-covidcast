import { levelMegaCounty } from '../../stores/constants';
import { MISSING_VALUE } from './encodings/utils';

export const S = {
  state: {
    border: 'state-border',
    center: 'state-centers',
  },
  msa: {
    border: 'msa-border',
    center: 'msa-centers',
  },
  county: {
    border: 'county-border',
    center: 'county-centers',
  },
  'mega-county': {
    border: 'mega-county-border',
    //center: 'mega-county-centers',
  },
  bubble: 'bubble-source',
  spike: {
    fill: 'spike-fill-source',
    stroke: 'spike-stroke-source',
  },
  cityPoint: 'city-point',
  megaCounty: 'mega-county',
  zoneOutline: 'zone-outline',
};

const fetchOptions = process.env.NODE_ENV === 'development' ? { cache: 'force-cache' } : {};

function json(url) {
  return fetch(url, fetchOptions).then((r) => r.json());
}

export function injectIDs(level, data) {
  data.features.forEach((d) => {
    d.properties.level = level;
    d.properties.value = MISSING_VALUE;
    d.properties.direction = MISSING_VALUE;
    d.properties.value1 = MISSING_VALUE;

    if (level === 'county') {
      d.id = d.properties.id = d.properties.GEO_ID.slice(-5);
    } else if (level === 'msa') {
      d.id = d.properties.id = d.properties.cbsafp;
    } else if (level === 'state') {
      d.properties.id = d.properties.POSTAL;
      d.id = d.properties.STATE;
    } else if (level === 'county-centers') {
      d.id = d.properties.GEO_ID.slice(-5);
    } else if (level == 'msa-centers') {
      d.id = d.properties.id;
    } else if (level == 'state-centers') {
      d.id = d.properties.STATE;
    }
  });
  return data;
}

function createMegaCopy(states) {
  return {
    ...states,
    features: states.features.map((feature) => ({
      ...feature,
      id: feature.properties.STATE + '000',
      properties: {
        ...feature.properties,
        level: levelMegaCounty.id,
        id: feature.properties.STATE + '000',
        NAME: `Rest of ${feature.properties.NAME}`,
        value: MISSING_VALUE,
        direction: MISSING_VALUE,
        value1: MISSING_VALUE,
      },
    })),
  };
}

export const geoJsonSources = Promise.all([
  json('./maps/new_counties.json'),
  json('./maps/new_states.json'),
  json('./maps/new_msa.json'),
  json('./maps/city_data/cities-reprojected.json'),
  json('./maps/state_centers.json'),
  json('./maps/county_centers.json'),
  json('./maps/msa_centers.json'),
  json('./maps/new_zones.json'),
]).then(([county, state, msa, cities, stateCenters, countyCenters, msaCenters, newZones]) => {
  const mega = createMegaCopy(state);
  return {
    county: { border: injectIDs('county', county), center: injectIDs('county-centers', countyCenters) },
    state: { border: injectIDs('state', state), center: injectIDs('state-centers', stateCenters) },
    msa: { border: injectIDs('msa', msa), center: injectIDs('msa-centers', msaCenters) },
    cities,
    newZones,
    mega,
  };
});
