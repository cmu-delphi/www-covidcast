import { getTextColorBasedOnBackground } from './util';
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
