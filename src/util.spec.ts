/// <reference types="jest" />
import { getTextColorBasedOnBackground, zip } from './util';
import { rgb } from 'd3-color';

describe('getTextColorBasedOnBackground', () => {
  test('white text on black bg', () => {
    expect(rgb(getTextColorBasedOnBackground('black')).formatHex()).toBe('#ffffff');
  });
  test('black text on dark grey bg', () => {
    expect(rgb(getTextColorBasedOnBackground('darkgrey')).formatHex()).toBe('#000000');
  });
  test('black text on white bg', () => {
    expect(rgb(getTextColorBasedOnBackground('white')).formatHex()).toBe('#000000');
  });
});

describe('zip', () => {
  test('simple', () => {
    expect(zip([0, 1, 2], [1, 2, 4])).toEqual([
      [0, 1],
      [1, 2],
      [2, 4],
    ]);
    expect(zip([0, 1, 2], [1, 2])).toEqual([
      [0, 1],
      [1, 2],
      [2, undefined],
    ]);
    expect(zip([0, 1], [1, 2, 3])).toEqual([
      [0, 1],
      [1, 2],
    ]);
  });
});
