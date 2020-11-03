import { randomNormal } from 'd3-random';
import seedrandom from 'seedrandom';
import { states, wrapEpiStructure } from './epidata';
import { timeDay } from 'd3-time';
import { formatAPITime, parseAPITime } from '../../../src/data/utils';

function dates(minTime, maxTime) {
  const min = parseAPITime(minTime.toString());
  const max = parseAPITime(maxTime.toString());

  return timeDay.range(min, timeDay.offset(max, 1)).map((d) => formatAPITime(d));
}

/**
 * generates data lookups for the given date and geo values
 * @param {string[]} dateRange list of dates in api format
 * @param {string[]} geoValues list of geo values
 * @param {() => boolean} isMissing generator whether it should be missing
 * @param {() => number} gen generator for a new value
 */
function generateData(dateRange, geoValues, isMissing, gen) {
  // matrix data
  const byRegion = new Map(geoValues.map((state) => [state, []]));
  const byDate = new Map();
  for (const date of dateRange) {
    if (isMissing()) {
      continue;
    }
    const time_value = Number.parseInt(date, 10);
    const entries = [];
    for (const geo_value of geoValues) {
      if (isMissing()) {
        continue;
      }
      const entry = { geo_value, time_value, value: gen() };
      entries.push(entry);
      byRegion.get(geo_value).push(entry);
    }
    byDate.set(date, entries);
  }
  return { byDate, byRegion };
}

export function visitWithSensor({
  /**
   * number of sensors to generate
   */
  numSensors = 1,
  /**
   * first time point
   */
  minTime = 20200201,
  /**
   * last time point
   */
  maxTime = 20201001,
  /**
   * string used to seed the random number generator
   */
  seed = 'seed',
  /**
   * mu for random normal parameterization
   */
  mu = 2,
  /**
   * sigma for random normal parameterization
   */
  sigma = 1,
  /**
   * minimum value of the signal
   */
  min = 0,
  /**
   * maximum value of the signal
   */
  max = 4,
  /**
   * initially selected state
   */
  region = 'NY',
  /**
   * percentage of missing values
   */
  missing = 0.02,
  /**
   * additional query parameters for the first visit
   */
  query = {},
} = {}) {
  /**
   * @type {import("../../src/data").SensorEntry[]}
   */
  const sensors = (Array.isArray(numSensors) ? numSensors : Array(numSensors).fill({})).map((mixin, i) => ({
    id: 's',
    signal: `s${i}`,
    name: `Test ${i}`,
    levels: ['state'],
    description: 'Test',
    format: 'raw',
    hasStdErr: false,
    mapTitleText: 'Test',
    type: 'public',
    yAxis: 'Value',
    ...mixin,
  }));

  const base = seedrandom(seed);
  const rnd = randomNormal.source(base)(mu, sigma);

  const gen = () => Math.max(Math.min(max, rnd()), min);
  const isMissing = () => base() <= missing;

  const meta = sensors.map((sensor) => ({
    min_time: minTime,
    max_time: maxTime,
    max_value: max,
    min_value: min,
    mean_value: mu,
    stdev_value: sigma,
    signal: sensor.signal,
    geo_type: sensor.levels[0],
    data_source: sensor.id,
  }));

  const dateRange = dates(minTime, maxTime);

  cy.route2(
    {
      query: {
        source: 'covidcast_meta',
      },
    },
    wrapEpiStructure(meta),
  );

  for (const sensor of sensors) {
    const { byDate, byRegion } = generateData(dateRange, states, isMissing, gen);

    // fake get sensor data
    cy.route2(
      {
        query: {
          signal: sensor.signal,
        },
      },
      (req) => {
        const params = new URL(req.url);
        if (params.searchParams.get('geo_value') === '*') {
          // a specific date
          req.reply(wrapEpiStructure(byDate.get(params.searchParams.get('time_values')) || []));
        } else {
          // specific region in a time slice
          const region = byRegion.get(params.searchParams.get('geo_value')) || [];
          const [start, end] = params.searchParams
            .get('time_values')
            .split('-')
            .map((d) => Number.parseInt(d, 10));
          const slice = region.filter((d) => d.time_value >= start && d.time_value <= end);
          req.reply(wrapEpiStructure(slice));
        }
      },
    );
  }

  cy.visit({
    url: '/index.html',
    qs: {
      sensors: JSON.stringify(sensors),
      region,
      ...query,
    },
  }).get('body[data-ready=ready]');
}
