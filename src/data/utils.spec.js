import { formatAPITime, parseAPITime, generateCorrelationMetrics } from './utils';
import { callAPIEndPoint } from './api';
import { enableFetchMocks } from 'jest-fetch-mock';
import fetchMocks from 'jest-fetch-mock';

enableFetchMocks();

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
  test('simple', async () => {
    fetchMocks.dontMock();
    let deaths = await callAPIEndPoint(
      'https://api.covidcast.cmu.edu/epidata/api.php',
      'indicator-combination',
      'deaths_7dav_incidence_prop',
      'county',
      [new Date('2020-10-30'), new Date('2021-03-21')],
      '42003',
    );
    let cli = await callAPIEndPoint(
      'https://api.covidcast.cmu.edu/epidata/api.php',
      'fb-survey',
      'smoothed_hh_cmnty_cli',
      'county',
      [new Date('2020-10-30'), new Date('2021-03-21')],
      '42003',
    );

    let metrics = {
      r2At0: 0.43,
      lagAtMaxR2: 0,
      r2AtMaxR2: 0.43,
    };
    expect(generateCorrelationMetrics(deaths.epidata, cli.epidata)).toEqual(metrics);
  });
});
