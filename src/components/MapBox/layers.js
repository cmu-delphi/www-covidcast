/*
Layer names used in MapBox
- state
- msa
- county
- bubble-fill
- bubble-highlight-fill
- spike
- spike-outline
- spike-outline-highlight
...
*/

export const L = {
  state: {
    fill: 'state-fill',
    stroke: 'state-stroke',
    hover: 'state-hover',
    selected: 'state-selected',
    names: 'state-names',
  },
  msa: {
    fill: 'msa-fill',
    stroke: 'msa-stroke',
    hover: 'msa-hover',
    selected: 'msa-selected',
  },
  county: {
    fill: 'county-fill',
    stroke: 'county-stroke',
    hover: 'county-hover',
    selected: 'county-selected',
  },
  'mega-county': {
    fill: 'mega-county-fill',
    stroke: 'mega-county-stroke',
    hover: 'mega-county-hover',
    selected: 'mega-county-selected',
  },
  bubble: {
    fill: 'bubble-fill',
    highlight: {
      fill: 'bubble-highlight-fill',
    },
  },
  spike: {
    fill: 'spike-fill',
    stroke: 'spike-stroke',
    highlight: {
      fill: 'spike-highlight-fill',
      stroke: 'spike-highlight-stroke',
    },
  },
  zoneOutline: 'zone-outline',
  cityPoints: {
    pit: 'city-point-unclustered-pit',
    1: 'city-point-unclustered-1',
    2: 'city-point-unclustered-2',
    3: 'city-point-unclustered-3',
    4: 'city-point-unclustered-4',
    5: 'city-point-unclustered-5',
  },
};
