const color_low = 'rgb(255, 237, 160)';
const color_medium = 'rgb(253, 96, 65)';
const color_high = 'rgb(128, 0, 0)';
const color_low_mega = 'rgba(255, 237, 160, 0.5)';
const color_medium_mega = 'rgba(253, 96, 65, 0.5)';
const color_high_mega = 'rgba(128, 0, 0, 0.5)';
const color_graph_line = '#767676';

export const DIRECTION_THEME = {
  increasing: color_high,
  steady: color_medium,
  decreasing: color_low,
  increasingIcon: '&#9650;',
  steadyIcon: '&#9644;',
  decreasingIcon: '&#9660;',
  max: color_high,
  countMin: 'rgb(242,242,242)',
  gradientMin: color_low,
  gradientMiddle: color_medium,
  gradientMax: color_high,
  gradientMinMega: color_low_mega,
  gradientMiddleMega: color_medium_mega,
  gradientMaxMega: color_high_mega,
};

export const MAP_THEME = {
  selectedRegionOutline: '#333333', //'#000000',
  hoverRegionOutline: '#cccccc', //'#ffffff',
  stateOutline: '#ffffff', //'#bcbcbc',
  countyFill: '#e4dac4',
  countyOutline: '#ffffff', //'#e0e0e0',
  countyOutlineWhenFilled: '#ffffff' //'#616161',
};