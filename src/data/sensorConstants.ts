import { scaleLinear } from 'd3-scale';
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
const extended = scaleLinear(['#7c187d', '#4d014a']).domain([0, 1]);

export function extendedColorScale(v: number): string {
  if (v <= 0.5) {
    return colorScales.bad(v * 2);
  }
  return extended((v - 0.5) * 2);
}
