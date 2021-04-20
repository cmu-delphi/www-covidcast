<script>
  import { timeDay, timeWeek } from 'd3-time';
  import Vega from '../../components/vega/Vega.svelte';
  import { addMissing, addNameInfos, fetchData, fetchTimeSlice, formatAPITime, parseAPITime } from '../../data';
  import { generateLineChartSpec, signalPatches, resolveHighlightedDate } from '../../specs/lineSpec';
  import { currentDateObject, currentRegionInfo } from '../../stores';
  import { sensorList } from '../../stores/constants';
  import { toTimeValue } from '../../stores/params';

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
              filter: 'datum.time_value == t.i1',
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
          mark: {
            type: 'circle',
            // tooltip: { content: 'data' },
            opacity: 0.1,
            size: 20,
          },
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
            color: {
              field: 'region',
              type: 'nominal',
              legend: {
                symbolOpacity: 1,
              },
            },
          },
        },

        {
          transform: [
            {
              aggregate: [
                {
                  op: 'values',
                  as: 'values',
                },
                {
                  op: 'min',
                  field: 'population',
                  as: 'population',
                },
              ],
              groupby: ['propertyId'],
            },
            {
              calculate: `array2object(datum.values, 'time_value')`,
              as: 'vs',
            },
            {
              calculate: `datum.values[0].region`,
              as: 'region',
            },
          ],
          layer: [
            {
              selection: {
                highlight: {
                  type: 'single',
                  on: 'click',
                  empty: 'none',
                  init: $currentRegionInfo
                    ? {
                        propertyId: $currentRegionInfo.propertyId.toUpperCase(),
                      }
                    : null,
                  fields: ['propertyId'],
                  nearest: false,
                },
              },
              mark: {
                type: 'circle',
                tooltip: { content: 'data' },
                x: {
                  expr: `lerp([scale('x', (datum.vs[t.i0] || {}).value), scale('x', (datum.vs[t.i1] || {}).value)], t.t)`,
                },
                y: {
                  expr: `lerp([scale('y', (datum.vs[t.i0] || {}).${yField}), scale('y', (datum.vs[t.i1] || {}).${yField})], t.t)`,
                },
              },
              encoding: {
                color: {
                  field: 'region',
                  type: 'nominal',
                },
                size: {
                  field: 'population',
                  type: 'quantitative',
                  scale: {
                    type: 'log',
                  },
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
                x: {
                  expr: `lerp([scale('x', warn(datum.propertyId, datum.vs[t.i0] || {}).value), scale('x', (datum.vs[t.i1] || {}).value)], t.t)`,
                },
                y: {
                  expr: `lerp([scale('y', (datum.vs[t.i0] || {}).${yField}), scale('y', (datum.vs[t.i1] || {}).${yField})], t.t)`,
                },
              },
              encoding: {
                text: {
                  field: 'propertyId',
                },
              },
            },
          ],
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
            point: true,
          },
          encoding: {
            x: {
              field: 'value',
              type: 'quantitative',
              sort: null,
            },
            y: {
              field: yField,
              type: 'quantitative',
              sort: null,
            },
            color: {
              field: 'region',
              type: 'nominal',
            },
          },
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
    ).then(addNameInfos);
  }

  const data = loadGapMinderData($currentDateObject);

  let currentDate = toTimeValue($currentDateObject);
  let t = {
    i0: currentDate,
    i1: currentDate,
    t: 1,
  };

  function onSignal(event) {
    if (event.detail.name === 'highlight' && !play) {
      const date = resolveHighlightedDate(event);
      if (date !== currentDate) {
        currentDate = date;
        t = {
          i0: currentDate,
          i1: currentDate,
          t: 1,
        };
      }
    }
  }

  let mode = 'change:1';

  $: thermalPlotSpec = thermalPlot(mode.split(':')[0], Number.parseInt(mode.split(':')[1], 10));

  const duration = 500;
  const step = duration / 20;

  let play = false;

  /**
   * @type {Vega}
   */
  let vegaLine = null;
  /**
   * @type {Vega}
   */
  let vegaThermalPlot = null;

  function tickAnimation(time, t) {
    const ti = {
      ...t,
      t: time / duration,
    };

    const view = vegaThermalPlot.vegaDirectAccessor();
    if (view) {
      view.signal('t', ti);
      view.runAsync();
    }

    const next = time + step;
    if (next >= duration) {
      setTimeout(tickTime, step);
    } else {
      setTimeout(tickAnimation, step, next, t);
    }
  }

  function tickTime() {
    const next = timeDay.offset(parseAPITime(currentDate), 1);
    if (next < $currentDateObject && play) {
      currentDate = toTimeValue(next);
      t = {
        i0: currentDate,
        i1: toTimeValue(timeDay.offset(parseAPITime(currentDate), 1)),
        t: 0,
      };
      /**
       * @type {import('vega-typings').View}
       */
      const view = vegaLine.vegaDirectAccessor();
      if (view) {
        view.signal('highlight_tuple', {
          unit: 'layer_1',
          fields: view.signal('highlight_tuple_fields'),
          values: [next.getTime()],
        });
        view.runAsync();
      }

      setTimeout(tickAnimation, step, step, t);
    }
  }

  $: {
    if (play) {
      tickTime();
    }
  }
</script>

<div class="uk-container root">
  <h2>{sensor.name} ThermalPlot</h2>
  <Vega
    bind:this={vegaLine}
    spec={lineSpec}
    data={casesData}
    signalListeners={['highlight']}
    signals={signalPatches}
    on:signal={onSignal}
  />
  <h3>ThermalPlot</h3>
  <select bind:value={mode}>
    <option value="change:1">value vs. change (value - day before value)</option>
    <option value="trend:1">value vs. trend ((value - day before value) / (day before value))</option>
    <option value="trend:7">value vs. trend ((value - week before value) / (week before value))</option>
  </select>
  <button
    on:click={() => {
      play = !play;
    }}>{play ? 'Stop' : 'Play'}</button
  >
  <Vega bind:this={vegaThermalPlot} spec={thermalPlotSpec} {data} className="gapminder" signals={{ t }} />
</div>

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
