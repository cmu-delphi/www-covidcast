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
  return {
    county: { border: county, center: countyCenters },
    state: { border: state, center: stateCenters },
    msa: { border: msa, center: msaCenters },
    cities,
    newZones,
  };
});
