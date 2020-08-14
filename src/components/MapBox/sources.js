import { MISSING_VALUE } from './encodings/utils';
import { loadSources } from '../../maps';
import { EPIDATA_CASES_OR_DEATH_VALUES } from '../../stores/constants';

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
};

const valueProperties = {
  value: MISSING_VALUE,
  direction: MISSING_VALUE,
};
EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
  valueProperties[key] = MISSING_VALUE;
});

export const geoJsonSources = loadSources(valueProperties);

/**
 *
 * @param {import('mapbox-gl').Map} map
 */
export function addCitySources(map) {
  return geoJsonSources.then((r) => {
    map.addSource(S.cityPoint, {
      type: 'geojson',
      data: r.cities,
    });
  });
}
