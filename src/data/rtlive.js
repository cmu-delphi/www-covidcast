import { decode } from '@ygoe/msgpack';
import { isoParse } from 'd3-time-format';
import { mean, deviation } from 'd3-array';
import { formatAPITime, parseAPITime } from './utils';
import { timeDay } from 'd3-time';

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
  console.log(decoded);
  const issue = new Date(decoded.last_updated_ts);
  const maxTime = isoParse(decoded.last_r0_date);

  const states = Object.values(decoded.state_data);
  const flat = states.map((d) => d.series).flat();

  const minTime = flat[0].date;

  const meta = {
    data_source: 'rtlive',
    signal: 'r0',
    time_type: 'day',
    max_issue: Number.parseInt(formatAPITime(issue), 10),
    min_time: Number.parseInt(formatAPITime(minTime), 10),
    max_time: Number.parseInt(formatAPITime(maxTime), 10),
    mean_value: mean(flat, (d) => d.r0),
    stdev_value: deviation(flat, (d) => d.r0),
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
    description: 'Test',
    format: 'raw',
    hasStdErr: false,
    levels: ['state', 'nation'],
    mapTitleText: 'Test',
    name: 'Rt.live',
    tooltipText: 'Test',
    yAxis: 'Effective Reproduction Rate',
    type: 'late',
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
