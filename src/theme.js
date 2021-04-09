export const MISSING_COLOR = '#eeeeee';
export const ZERO_COLOR = 'rgb(242,242,242)';

export const MAP_THEME = {
  selectedRegionOutline: '#333333', //'#000000',
  hoverRegionOutline: '#cccccc', //'#ffffff',
  stateFill: 'rgba(0, 0, 0, 0)',
  stateOutline: '#ffffff', //'#bcbcbc',
  countyFill: '#eeeeee', //'#e4dac4', // missing value
  countyOutline: '#ffffff', //'#e0e0e0',
  countyOutlineWhenFilled: '#ffffff', //'#616161',
};

export const selectionColors = ['#0F0589', '#16A997', '#A71808', '#CD22B2', '#F58B29'];

export const ENCODING_BUBBLE_THEME = {
  color: 'transparent',
  countyFill: '#eeeeee',
  strokeColor: '#666',
  strokeWidth: 1,
  strokeWidthHighlighted: 4,
  fillOpacity: 0.5,
  strokeOpacity: 1,
  maxRadius: {
    county: 6,
    msa: 10,
    hrr: 10,
    state: 20,
    hhs: 20,
    nation: 20,
  },
  radiusScale: {
    count: {
      type: 'sqrt', // one of ['sqrt', 'log', 'linear']
    },
    prop: {
      type: 'linear',
    },
    other: {
      type: 'linear',
    },
  },
};

export const ENCODING_SPIKE_THEME = {
  fillOpacity: 0.2,
  countyFill: '#eeeeee',
  strokeOpacity: 1,

  maxHeight: {
    county: 20,
    msa: 40,
    hrr: 40,
    state: 80,
    hhs: 80,
    nation: 80,
  },
  size: {
    county: 4,
    msa: 8,
    hrr: 8,
    state: 16,
    hhs: 16,
    nation: 16,
  },
  heightScale: {
    count: {
      type: 'sqrt',
    },
    prop: {
      type: 'linear',
    },
    other: {
      type: 'linear',
    },
  },
};
