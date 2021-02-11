<script>
  import { timeWeek } from 'd3-time';
  import debounce from 'lodash-es/debounce';
  import Vega from '../../components/Vega.svelte';
  import { addMissing, fetchData, fetchTimeSlice, formatAPITime } from '../../data';
  import { stateInfo } from '../../maps';
  import { generateLineChartSpec, signalPatches } from '../../specs/lineSpec';
  import { currentDate, currentDateObject } from '../../stores';
  import { sensorList } from '../../stores/constants';
  import { resolveHighlightedTimeValue } from '../overview/vegaSpec';

  const sensor = sensorList.find((d) => d.signal === 'smoothed_wearing_mask' && d.id === 'fb-survey');

  function thermalPlot() {
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      padding: { left: 50, top: 16, bottom: 20, right: 100 },
      autosize: {
        type: 'none',
        contains: 'padding',
        resize: true,
      },
      data: {
        name: 'values',
      },
      transform: [
        {
          calculate: 'upper(datum.geo_value)',
          as: 'propertyId',
        },
        {
          lookup: 'propertyId',
          from: {
            data: { values: stateInfo },
            key: 'propertyId',
            fields: ['displayName', 'population', 'region'],
          },
        },
        {
          window: [
            {
              op: 'first_value',
              field: 'value',
              as: 'a_week_ago',
            },
          ],
          frame: [-5, 0],
          groupby: ['propertyId'],
        },
        {
          calculate: '(datum.value / datum.a_week_ago - 1)',
          as: 'trend',
        },
        {
          calculate: '1 + 10*(dayofyear(toDate(currentDate)) - dayofyear(toDate(datum.date_value)))',
          as: 'age',
        },
      ],

      layer: [
        {
          mark: {
            type: 'rule',
            strokeWidth: 3,
          },
          encoding: {
            y: {
              type: 'quantitative',
              datum: 0,
            },
          },
        },
        {
          transform: [
            {
              filter: 'toNumber(datum.date_value) == toNumber(currentDate)',
            },
            {
              quantile: 'value',
              probs: [0.05, 0.25, 0.5, 0.75, 0.95],
              //aggregate: [
              // {
              //   field: 'value',
              //   op: 'median',
              //   as: 'value',
              // },
              // ],
            },
          ],
          layer: [
            {
              mark: {
                type: 'rule',
              },
              encoding: {
                strokeWidth: {
                  condition: {
                    test: 'datum.prob == 0.5',
                    value: 3,
                  },
                  value: 1,
                },
                strokeDash: {
                  condition: {
                    test: 'datum.prob == 0.5',
                    value: null,
                  },
                  value: [5, 5],
                },
              },
            },
            {
              mark: {
                type: 'text',
                y: 0,
                dy: -5,
              },
              encoding: {
                text: {
                  condition: [
                    {
                      test: 'datum.prob == 0.5',
                      value: 'US Median',
                    },
                    {
                      test: 'datum.prob == 0.25',
                      value: '25% Quantile',
                    },
                    {
                      test: 'datum.prob == 0.75',
                      value: '75% Quantile',
                    },
                    {
                      test: 'datum.prob == 0.05',
                      value: '5% Quantile',
                    },
                    {
                      test: 'datum.prob == 0.95',
                      value: '95% Quantile',
                    },
                  ],
                  value: null,
                },
              },
            },
          ],
          encoding: {
            x: {
              field: 'value',
              type: 'quantitative',
            },
          },
        },
        {
          encoding: {
            x: {
              field: 'value',
              type: 'quantitative',
              axis: {
                grid: true,
                title: null,
                domain: false,
                format: '.1f',
                tickCount: 5,
                labelFontSize: 14,
              },
              scale: {
                round: true,
                zero: false,
                domainMin: null,
              },
            },
            y: {
              field: 'trend',
              type: 'quantitative',
              axis: {
                grid: true,
                title: null,
                domain: false,
                format: '+.1p',
                tickCount: 5,
                labelFontSize: 14,
              },
              scale: {
                round: true,
                zero: false,
                domainMin: null,
              },
            },
          },
          layer: [
            {
              selection: {
                highlight: {
                  type: 'single',
                  on: 'mouseover',
                  empty: 'none',
                  fields: ['propertyId'],
                },
              },
              mark: {
                type: 'circle',
                tooltip: { content: 'data' },
              },
              encoding: {
                size: {
                  condition: {
                    test: 'toNumber(datum.date_value) != toNumber(currentDate)',
                    value: 20,
                  },
                  field: 'population',
                  type: 'quantitative',
                  scale: {
                    type: 'log',
                  },
                },
                color: {
                  field: 'region',
                  type: 'nominal',
                },
                opacity: {
                  field: 'age',
                  type: 'quantitative',
                  scale: {
                    type: 'log',
                    range: [1, 0],
                  },
                  legend: null,
                  // condition: [
                  //   {
                  //     test: 'toNumber(datum.date_value) == toNumber(currentDate)',
                  //     value: 1,
                  //   },
                  // ],
                },
              },
            },
            {
              mark: {
                type: 'text',
                dx: 5,
                dy: -5,
                align: 'left',
                baseline: 'bottom',
              },
              encoding: {
                text: {
                  field: 'displayName',
                },
                opacity: {
                  // field: 'date_value',
                  // type: 'temporal',
                  // scale: {
                  //   type: 'pow',
                  //   range: [0, 1]
                  // }
                  condition: {
                    test: {
                      and: [
                        {
                          selection: 'highlight',
                        },
                        'toNumber(datum.date_value) == toNumber(currentDate)',
                      ],
                    },
                    value: 1,
                  },
                  value: 0,
                },
              },
            },
            {
              transform: [
                {
                  filter: {
                    selection: 'highlight',
                  },
                },
              ],
              mark: {
                type: 'line',
                opacity: 0.5,
                point: false,
              },
              encoding: {
                color: {
                  field: 'region',
                  type: 'nominal',
                },
              },
            },
          ],
        },
      ],
      config: {
        customFormatTypes: true,
        view: {
          stroke: null,
        },
      },
    };
    return spec;
  }

  $: thermalPlotSpec = thermalPlot();

  const lineSpec = generateLineChartSpec({ height: 150, initialDate: $currentDateObject });

  const casesData = fetchTimeSlice(sensor, 'nation', 'us').then((r) => addMissing(r, sensor));
  // const masksData = fetchTimeSlice(masks, 'nation', 'us').then((r) => addMissing(r, cases));

  function loadGapMinderData(date) {
    const start = timeWeek.offset(date, -4);
    return fetchData(sensor, 'state', '*', `${formatAPITime(start)}-${formatAPITime(date)}`);
  }

  $: data = loadGapMinderData($currentDateObject);

  const lazyUpdate = debounce((value) => {
    currentDate.set(value);
  }, 1000);

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const date = resolveHighlightedTimeValue(event);
      if (date) {
        lazyUpdate(date);
      }
    }
  }
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
    margin: 0;
  }
  .root > :global(.gapminder) {
    height: 500px;
  }
</style>

<div class="uk-container root">
  <h2>{sensor.name} ThermalPlot</h2>
  <Vega spec={lineSpec} data={casesData} signalListeners={['highlight']} signals={signalPatches} on:signal={onSignal} />
  <h3>ThermalPlot: value vs. trend (percentage change to last week)</h3>
  <Vega spec={thermalPlotSpec} {data} className="gapminder" signals={{ currentDate: $currentDateObject }} />
</div>
