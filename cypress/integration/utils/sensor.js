import {} from 'd3-random';
import { wrapEpiStructure } from './epidata';

export function visitWithSensor({ numSensors = 1, minTime = 20200201, maxTime = 20201001, seed = 1, focus = 'NY' }) {
  /**
   * @type {import("../../src/data").SensorEntry[]}
   */
  const sensors = [
    {
      id: 's',
      signal: 's',
      name: 'Test',
      levels: ['state'],
      description: 'Test',
      format: 'raw',
      hasStdErr: false,
      mapTitleText: 'Test',
      type: 'public',
      yAxis: 'Value',
    },
  ];
  const meta = [
    {
      min_time: minTime,
      max_time: maxTime,
      max_value: 4,
      min_value: 0,
      mean_value: 2,
      stdev_value: 0.5,
      signal: 's',
      geo_type: 'state',
      data_source: 's',
    },
  ];

  /**
   * @type {import("../../src/data").EpiDataRow[]}
   */
  const allRegions = [
    {
      geo_value: 'ny',
      value: 2,
    },
    {
      geo_value: 'nj',
      value: 4,
    },
  ];
  /**
   * @type {import("../../src/data").EpiDataRow[]}
   */
  const singleRegion = [
    {
      time_value: 20200601,
      value: 2,
    },
    {
      time_value: 20200602,
      value: 2.1,
    },
    {
      time_value: 20200604,
      value: 2.2,
    },
    {
      time_value: 20200801,
      value: 1,
    },
    {
      time_value: 20200802,
      value: 1.2,
    },
    {
      time_value: 20200803,
      value: 1.4,
    },
    {
      time_value: 20200804,
      value: 1.6,
    },
  ];

  cy.route2(
    {
      query: {
        source: 'covidcast_meta',
      },
    },
    wrapEpiStructure(meta),
  );
  cy.route2(
    {
      query: {
        geo_value: /[*]/,
      },
    },
    wrapEpiStructure(allRegions),
  );
  cy.route2(
    {
      query: {
        geo_value: 'NY',
      },
    },
    wrapEpiStructure(singleRegion),
  );

  cy.visit({
    url: '/index.html',
    qs: {
      sensors: JSON.stringify(sensors),
      region: 'NY',
    },
  });
}
