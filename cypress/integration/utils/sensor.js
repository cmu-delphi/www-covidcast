import { randomNormal } from 'd3-random';
import seedrandom from 'seedrandom';
import { states, wrapEpiStructure } from './epidata';
import { timeDay } from 'd3-time';
import { formatAPITime, parseAPITime } from '../../../src/data/utils';

function dates(minTime, maxTime) {
  const min = parseAPITime(minTime.toString());
  const max = parseAPITime(maxTime.toString());

  return timeDay.range(min, timeDay.offset(max, 1));
}

function generateData(dateRange, isMissing, gen) {
  // matrix data
  const byRegion = new Map(states.map((state) => [state, []]));
  const byDate = new Map();
  for (const date of dateRange) {
    if (isMissing()) {
      continue;
    }
    const key = formatAPITime(date);
    const time_value = Number.parseInt(key, 10);
    const entries = [];
    for (const geo_value of states) {
      if (isMissing()) {
        continue;
      }
      const entry = { geo_value, time_value, value: gen() };
      entries.push(entry);
      byRegion.get(geo_value).push(entry);
    }
    byDate.set(key, entries);
  }
  return { byDate, byRegion };
}

export function visitWithSensor({
  numSensors = 1,
  minTime = 20200201,
  maxTime = 20201001,
  seed = 'seed',
  mu = 2,
  sigma = 1,
  min = 0,
  max = 4,
  region = 'NY',
  missing = 0.02,
  query = {},
} = {}) {
  /**
   * @type {import("../../src/data").SensorEntry[]}
   */
  const sensors = Array(numSensors)
    .fill(0)
    .map((_, i) => ({
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
    const { byDate, byRegion } = generateData(dateRange, isMissing, gen);

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
