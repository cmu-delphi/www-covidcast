const color_decreasing = 'rgb(86,157,201)'; //''rgb(0,223,252)'//'#badee8';
const color_steady = 'rgb(220, 220, 220)'; // 'rgb(249,212,35)' //'#f2df91';
const color_increasing = 'rgb(218,107,87)'; //rgb(255,78,80)' //'#ce0a05';

const color_decreasing_mega = 'rgba(86,157,201,0.5)'; //'#badee8';
const color_steady_mega = 'rgba(220, 220, 220,0.5)'; //'#f2df91';
const color_increasing_mega = 'rgba(218,107,87, 0.5)'; //'#ce0a05';

export const DIRECTION_THEME = {
  increasing: color_increasing, //color_high,
  steady: color_steady, //color_medium,
  decreasing: color_decreasing, //color_low,
  increasingIcon: '&#9650;',
  steadyIcon: '&#9644;',
  decreasingIcon: '&#9660;',
  max: color_increasing, //color_high,
  countMin: 'rgb(242,242,242)',
  gradientMin: color_decreasing,
  gradientMiddle: color_steady,
  gradientMax: color_increasing,
  gradientMinMega: color_decreasing_mega,
  gradientMiddleMega: color_steady_mega,
  gradientMaxMega: color_increasing_mega,
};

export const MAP_THEME = {
  selectedRegionOutline: '#333333', //'#000000',
  hoverRegionOutline: '#cccccc', //'#ffffff',
  stateOutline: '#ffffff', //'#bcbcbc',
  countyFill: '#eeeeee', //'#e4dac4',
  countyOutline: '#ffffff', //'#e0e0e0',
  countyOutlineWhenFilled: '#ffffff', //'#616161',
};

export const ENCODING_BUBBLE_THEME = {
  color: 'transparent',
  strokeColor: '#666',
  strokeWidth: 1,
  opacity: 0.5,
  strokeOpacity: 1,
  maxRadius: {
    county: 10,
    msa: 15,
    state: 30,
  },
  base: 3,
};
