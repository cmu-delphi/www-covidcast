import { MISSING_VALUE } from './encodings/utils';
import { loadSources } from '../../maps';

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
  value1: MISSING_VALUE,
  direction: MISSING_VALUE,
};

export const geoJsonSources = loadSources(valueProperties);
