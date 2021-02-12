<script>
  import { timeWeek } from 'd3-time';
  import Vega from '../../components/Vega.svelte';
  import { addMissing, fetchData, fetchTimeSlice, formatAPITime } from '../../data';
  import { stateInfo } from '../../maps';
  import { generateLineChartSpec, signalPatches } from '../../specs/lineSpec';
  import { currentDateObject, currentRegionInfo } from '../../stores';
  import { sensorList } from '../../stores/constants';
  import { resolveHighlightedTimeValue } from '../overview/vegaSpec';

  const sensor = sensorList.find((d) => d.signal === 'smoothed_wearing_mask' && d.id === 'fb-survey');
  // const sensor = sensorList.find((d) => d.signal === 'smoothed_cli' && d.id === 'fb-survey');
  // const sensor = sensorList.find((d) => d.isCasesOrDeath);

  function thermalPlot(yField = 'change', offset = 1) {
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
          // clamp in [0, 100] range
          calculate: 'min(max(datum.value, 0), 100)',
          as: 'value',
        },
        {
          // impute missing by forwarding the one from the previous day
          impute: 'value',
          key: 'time_value',
          groupby: ['propertyId'],
          frame: [-1, 0],
          method: 'min',
        },
        {
          // caculate the value a week ago
          window: [
            {
              op: 'first_value',
              field: 'value',
              as: `x${offset}day_ago`,
            },
          ],
          sort: ['time_value'],
          frame: [-offset, 0],
          groupby: ['propertyId'],
        },
        {
          calculate: `datum.value / datum.x${offset}day_ago - 1`,
          as: 'trend',
        },
        {
          calculate: `datum.value - datum.x${offset}day_ago`,
          as: 'change',
        },
      ],

      layer: [
        // horizontal 0 hint
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
        // vertical hints
        {
          transform: [
            {
              filter: 'datum.time_value == currentTime',
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
              sort: null,
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
                // for cases
                // domainMin: 0,
                // domainMax: 150,
                clamp: true,
              },
            },
            y: {
              field: yField,
              type: 'quantitative',
              sort: null,
              axis: {
                grid: true,
                title: null,
                domain: false,
                format: yField === 'trend' ? '+.1p' : '.1f',
                tickCount: 5,
                labelFontSize: 14,
              },
              scale: {
                round: true,
                zero: false,
                // domainMin: -1,
                // domainMax: 1,
              },
            },
          },
          layer: [
            {
              selection: {
                highlight: {
                  type: 'single',
                  on: 'click',
                  empty: 'none',
                  init: {
                    propertyId: $currentRegionInfo.propertyId.toUpperCase(),
                  },
                  fields: ['propertyId'],
                  nearest: true,
                },
              },
              mark: {
                type: 'circle',
                tooltip: { content: 'data' },
              },
              encoding: {
                size: {
                  // not the current, fixed size
                  condition: {
                    test: 'datum.time_value != currentTime',
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
                  // highlighted -> highlight = 1, current date = 0.5 else 0.1
                  // not highlighted -> current date = 1 else 0.1
                  condition: [
                    {
                      selection: 'highlight',
                      value: 1,
                    },
                    {
                      test: 'datum.time_value == currentTime && highlight.propertyId != null',
                      value: 0.5,
                    },
                    {
                      test: 'datum.time_value == currentTime',
                      value: 1,
                    },
                  ],
                  value: 0.1,
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
                  field: 'propertyId',
                },
                opacity: {
                  // highlighted -> highlightd & current date = 1, current date = 1 else 0.5
                  // not highlighted -> current date = 1 else 0
                  condition: [
                    {
                      test: {
                        and: [
                          {
                            selection: 'highlight',
                          },
                          'datum.time_value == currentTime',
                        ],
                      },
                      value: 1,
                    },
                    {
                      test: 'datum.time_value == currentTime && highlight.propertyId != null',
                      value: 0.5,
                    },
                    {
                      test: 'datum.time_value == currentTime',
                      value: 1,
                    },
                  ],
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

  const lineSpec = generateLineChartSpec({ height: 150, initialDate: $currentDateObject });

  const start = timeWeek.offset($currentDateObject, -8);
  const casesData = fetchTimeSlice(sensor, 'nation', 'us', start, $currentDateObject).then((r) =>
    addMissing(r, sensor),
  );
  // const masksData = fetchTimeSlice(masks, 'nation', 'us').then((r) => addMissing(r, cases));

  function loadGapMinderData(date) {
    return fetchData(
      sensor,
      'state',
      '*',
      `${formatAPITime(start)}-${formatAPITime(date)}`,
      {},
      { multiValues: false },
    );
  }

  const data = loadGapMinderData($currentDateObject);

  let currentDate = Number.parseInt(formatAPITime($currentDateObject));

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const date = resolveHighlightedTimeValue(event);
      if (date !== currentDate) {
        currentDate = date;
      }
    }
  }

  let mode = 'change:1';

  $: thermalPlotSpec = thermalPlot(mode.split(':')[0], Number.parseInt(mode.split(':')[1], 10));
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
  <h3>ThermalPlot</h3>
  <select bind:value={mode}>
    <option value="change:1">value vs. change (value - day before value)</option>
    <option value="trend:1">value vs. trend ((value - day before value) / (day before value))</option>
    <option value="trend:7">value vs. trend ((value - week before value) / (week before value))</option>
  </select>
  <Vega spec={thermalPlotSpec} {data} className="gapminder" signals={{ currentTime: currentDate }} />
</div>
