import { formatAPITime, parseAPITime, generateCorrelationMetrics } from './utils';
import { cliTestData, deathsTestData } from './testData';

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

describe('correlationMetrics', () => {
  test('Deaths vs. CLI correlation should equal what was published in the blog post', async () => {
    let metrics = {
      r2At0: 0.43,
      lagAtMaxR2: 20,
      r2AtMaxR2: 0.81,
    };
    expect(generateCorrelationMetrics(deathsTestData, cliTestData)).toEqual(metrics);
  });
});
