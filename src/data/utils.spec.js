import { formatAPITime, parseAPITime } from './utils';

describe('formatAPITime', () => {
  test('matches api format', () => {
    const d = new Date(2020, 1, 2);
    expect(formatAPITime(d)).toBe('20200202');
  });
});

describe('parseAPITime', () => {
  test('default', () => {
    const d = new Date(2020, 1, 2);
    expect(parseAPITime(20200202).valueOf()).toBe(d.valueOf());
  });
  test('round trip', () => {
    const d = new Date(2020, 5, 8);
    expect(parseAPITime(formatAPITime(d)).valueOf()).toBe(d.valueOf());
  });
  test('strip to date', () => {
    const d = new Date(2020, 5, 8, 5, 2);
    const day = new Date(2020, 5, 8);
    expect(parseAPITime(formatAPITime(d)).valueOf()).toBe(day.valueOf());
  });
});
