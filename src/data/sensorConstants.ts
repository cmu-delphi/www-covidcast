import { interpolateBuPu, interpolateYlGnBu, interpolateYlOrRd } from 'd3-scale-chromatic';

export const colorScales = {
  good: interpolateYlGnBu,
  bad: interpolateYlOrRd,
  neutral: interpolateBuPu,
};

export const vegaColorScales = {
  good: 'yellowgreenblue',
  bad: 'yelloworangered',
  neutral: 'bluepurple',
};

export function extendedColorScale(v: number): string {
  if (v <= 0.5) {
    return colorScales.bad(v * 2);
  }
  // only 2nd half
  return colorScales.neutral(v);
}
