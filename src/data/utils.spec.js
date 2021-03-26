import { formatAPITime, parseAPITime, generateCorrelationMetrics } from './utils';
import { cliTestData, deathsTestData } from './test/testData';

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
  test('Deaths vs. CLI correlations should equal what was published in the blog post', async () => {
    let expected_metrics = {
      r2At0: 0.43,
      lagAtMaxR2: 20,
      r2AtMaxR2: 0.81,
    };
    let actual_metrics = generateCorrelationMetrics(deathsTestData, cliTestData);
    expect(actual_metrics.r2At0).toEqual(expected_metrics.r2At0);
    expect(actual_metrics.lagAtMaxR2).toEqual(expected_metrics.lagAtMaxR2);
    expect(actual_metrics.r2AtMaxR2).toEqual(expected_metrics.r2AtMaxR2);
    expect(actual_metrics.lags.length).toEqual(28 * 2 + 1);
  });
});
