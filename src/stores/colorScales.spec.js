import { resolveColorScale, DEFAULT_COLOR_SCALE } from './colorScales';
import { interpolateBlues } from 'd3-scale-chromatic';

describe('colorScales', () => {
  test('default', () => {
    expect(typeof resolveColorScale()).toBe('function');
    expect(typeof resolveColorScale()(0.5)).toBe('string');
    expect(resolveColorScale()).toBe(DEFAULT_COLOR_SCALE);
  });
  test('named', () => {
    expect(resolveColorScale('interpolateBlues')).toBe(interpolateBlues);
  });
  test('invalid name', () => {
    expect(resolveColorScale('interpolateBluesX')).toBe(DEFAULT_COLOR_SCALE);
  });
  test('function', () => {
    const v = () => 'red';
    expect(resolveColorScale(v)).toBe(v);
  });
});
