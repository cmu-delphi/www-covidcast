import { decode } from '@ygoe/msgpack';
import { isoParse } from 'd3-time-format';
import { mean, deviation, max, min } from 'd3-array';
import { formatAPITime } from './utils';
import { interpolateRdYlGn } from 'd3-scale-chromatic';

const PACKED_URL = 'https://d14wlfuexuxgcm.cloudfront.net/covid/parsed_for_js5_release.pack.gz';

/**
 * @typedef {object} RTLiveMessagePackState
 * @property {{date: string, type: string}[]} annotations
 * @property {string} identifier
 * @property {number} population
 * @property {{cases_new: number, corr_cases_new: number, date: string, deaths_new: number | null, onsets: number, r0: number, r0_h80: number, r0_l80: number, tests_new: number | null}[]} series
 */

/**
 * @typedef {object} RTLiveMessagePack
 * @property {number} last_updated_ts
 * @property {string} last_r0_date
 * @property {Record<string, RTLiveMessagePackState>} state_data
 */
/**
 * @param {RTLiveMessagePack} decoded
 */
function preparePack(decoded) {
  const issue = new Date(decoded.last_updated_ts);
  const maxTime = isoParse(decoded.last_r0_date);

  const states = Object.values(decoded.state_data);
  const flat = states.map((d) => d.series).flat();

  const minTime = flat[0].date;

  const values = flat.map((d) => d.r0);

  const meta = {
    data_source: 'rtlive',
    signal: 'r0',
    time_type: 'day',
    max_issue: Number.parseInt(formatAPITime(issue), 10),
    min_time: Number.parseInt(formatAPITime(minTime), 10),
    max_time: Number.parseInt(formatAPITime(maxTime), 10),
    max_value: max(values),
    min_value: min(values),
    mean_value: mean(values),
    stdev_value: deviation(values),
  };

  const perRegion = new Map(
    states.map((state) => [
      state.identifier.toLowerCase(),
      state.series.map((s) => ({
        time_value: Number.parseInt(formatAPITime(isoParse(s.date)), 10),
        geo_value: state.identifier.toLowerCase(),
        value: s.r0,
      })),
    ]),
  );
  const perDate = new Map();
  perRegion.forEach((rows) => {
    rows.forEach((row) => {
      if (!perDate.has(row.time_value)) {
        perDate.set(row.time_value, [row]);
      } else {
        perDate.get(row.time_value).push(row);
      }
    });
  });

  function wrapResult(rows) {
    if (rows.length === 0) {
      return {
        result: 2,
        message: 'No results',
        epidata: rows,
      };
    }
    return {
      result: 1,
      message: 'Success',
      epidata: rows,
    };
  }

  function load(_id, _signal, _level, date, region) {
    if (region === '*') {
      // single date all regions
      const timeValue = Number.parseInt(date instanceof Date ? formatAPITime(date) : date, 10);
      return wrapResult(perDate.get(timeValue) || []);
    }
    const data = perRegion.get(region.toLowerCase()) || [];
    if (typeof date === 'string' && date.includes('-')) {
      // range
      const [start, end] = date.split('-').map((d) => Number.parseInt(d, 10));
      return wrapResult(data.filter((d) => d.time_value >= start && d.time_value <= end));
    } else {
      // single
      return wrapResult(data);
    }
  }

  return {
    meta,
    load,
  };
}

function fetchPack() {
  return fetch(PACKED_URL)
    .then((r) => r.arrayBuffer())
    .then((data) => decode(data))
    .then(preparePack);
}

fetchPack();

export function createRTLiveSignal() {
  let data = null;
  /**
   * @type {Partial<import('./fetchData').SensorEntry>}
   */
  const signal = {
    id: 'rtlive',
    signal: 'r0',
    name: 'Rt.live',
    format: 'raw',
    hasStdErr: false,
    levels: ['state', 'nation'],
    mapTitleText:
      'Rt is the average number of people who become infected by an infectious person. If it’s above 1.0, COVID-19 will spread quickly. If it’s below 1.0, infections will slow.',
    links: [`<a href="https://rt.live/faq">Rt.live FAQ</a>`],
    description: `R<sup>t</sup> represents the effective reproduction rate of the virus calculated for each locale. It lets us estimate how many secondary infections are likely to occur from a single infection in a specific area. Values over 1.0 mean we should expect more cases in that area, values under 1.0 mean we should expect fewer.`,
    yAxis: 'Effective Reproduction Rate',
    type: 'late',
    colorScale: (v) => interpolateRdYlGn(1 - v),
    divergingCenter: 1,
    neutralValue: 1,
    api: (...args) => {
      return data.then((r) => r.load(...args));
    },
    meta: () => {
      data = fetchPack();
      return data.then((r) => r.meta);
    },
  };
  return signal;
}
