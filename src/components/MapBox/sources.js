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
  spike: {
    fill: 'spike-fill-source',
  },
  cityPoint: 'city-point',
  megaCounty: 'mega-county',
  zoneOutline: 'zone-outline',
};

export const geoJsonSources = loadSources({});
