import { generateCorrelationMetrics } from './correlation';
import { cliTestData, deathsTestData, cases_national, safegraph_full_time_national } from './__test__/testData';

describe('correlationMetrics', () => {
  test('Deaths vs. CLI correlations should equal what was published in the blog post', async () => {
    let expected_metrics = {
      r2At0: 0.5,
      lagAtMaxR2: -20,
      r2AtMaxR2: 0.81,
    };
    let actual_metrics = generateCorrelationMetrics(deathsTestData, cliTestData);
    expect(actual_metrics.r2At0).toEqual(expected_metrics.r2At0);
    expect(actual_metrics.lagAtMaxR2).toEqual(expected_metrics.lagAtMaxR2);
    expect(actual_metrics.r2AtMaxR2).toEqual(expected_metrics.r2AtMaxR2);
    expect(actual_metrics.lags.length).toEqual(28 * 2 + 1);
  });
  test('Signals with different date ranges should correlate on the union of their dates.', async () => {
    let expected_metrics = {
      r2At0: -0.59,
      lagAtMaxR2: -28,
      r2AtMaxR2: -0.07,
    };
    let actual_metrics = generateCorrelationMetrics(cases_national, safegraph_full_time_national);
    expect(actual_metrics.r2At0).toEqual(expected_metrics.r2At0);
    expect(actual_metrics.lagAtMaxR2).toEqual(expected_metrics.lagAtMaxR2);
    expect(actual_metrics.r2AtMaxR2).toEqual(expected_metrics.r2AtMaxR2);
    expect(actual_metrics.lags.length).toEqual(28 * 2 + 1);
  });
  test('Signals with not enough overlap should error.', async () => {
    expect(() => {
      generateCorrelationMetrics(cases_national, safegraph_full_time_national.slice(-30));
    }).toThrow();
  });
});
