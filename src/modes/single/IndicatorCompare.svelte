<script>
  // import VegaTooltip from '../../components/DetailView/VegaTooltip.svelte';

  import Vega from '../../components/Vega.svelte';
  import { formatAPITime, parseAPITime } from '../../data';
  // import { formatDateLocal } from '../../formats';
  import { sensorList } from '../../stores/constants';
  import { currentSensorEntry, smallMultipleTimeSpan } from '../../stores';
  import { prepareSensorData } from '../overview/vegaSpec';

  /**
   * @type {import("../../stores/constants").SensorEntry}
   */
  export let sensor;

  export let sensorMatrixData;
  export let lag = 0;

  export let options = {};

  /**
   * @type {Date}
   */
  export let date;

  export let onHighlight;
  export let highlightTimeValue;

  $: highlightDate = highlightTimeValue != null ? parseAPITime(highlightTimeValue) : null;

  // use local variables with manual setting for better value comparison updates
  let startDay = $smallMultipleTimeSpan[0];
  let endDay = $smallMultipleTimeSpan[1];
  $: {
    if (startDay.getTime() !== $smallMultipleTimeSpan[0].getTime()) {
      startDay = $smallMultipleTimeSpan[0];
    }
    if (endDay.getTime() !== $smallMultipleTimeSpan[1].getTime()) {
      endDay = $smallMultipleTimeSpan[1];
    }
  }
  /**
   * @type {import('../../stores').CompareSelection[]}
   */
  export let selections = [];

  $: sensorWithData = prepareSensorData(sensor, selections, startDay, endDay);

  /**
   * @type {(number | null)[]}
   */
  let values = selections.map(() => null);

  $: {
    const keyDate = formatAPITime(highlightDate ? highlightDate : date);
    Promise.resolve(sensorWithData.data).then((rows) => {
      values = selections.map((region) => {
        const row = rows.find((d) => String(d.time_value) === keyDate && d.geo_value === region.info.propertyId);
        return row ? row.value : null;
      });
    });
  }

  /**
   * @type {import('../../stores/constants').SensorEntry[]}
   */
  $: otherSensors = [sensor, $currentSensorEntry];

  let chosenColumn = ''; // Sensor chosen by user from menu.
  $: {
    if (chosenColumn) {
      const chosenSensor = sensorList.find((d) => d.key === chosenColumn);
      otherSensors = otherSensors.concat([chosenSensor]);
      chosenColumn = '';
      // console.info('otherSensors', otherSensors);
    }
  }

  // row and column are field names as keys.
  function makeMatrixCellSpec(row, column, options = {}) {
    console.info('makeMatrixCellSpec options', options);
    const lag = options.lag || 0;
    const width = options.width || 100;
    const height = options.height || 100;
    const sizeLegend = options.sizeLegend || null;

    // console.info('width', width, 'height', height);
    const chartSpec = {
      width: width,
      height: height,
      padding: options.padding != null ? options.padding : null,
      mark: {
        type: 'point',
        tooltip: options.showTooltips,
      },

      selection: {
        highlight: {
          type: 'single',
          empty: 'none',
          on: 'mouseover',
          nearest: true,
          clear: 'mouseout',
        },
      },

      encoding: {
        x: {
          field: 'x',
          title: options.axisTitles ? options.xtitle : '',
          type: 'quantitative',
          scale: {
            zero: false,
            domainMin: null,
            domainMax: null,
          },
          axis: {
            ticks: options.ticks,
            labels: options.tickLabels,
          },
        },
        y: {
          field: 'y',
          title: options.axisTitles ? options.ytitle : '',
          type: 'quantitative',
          scale: {
            zero: false,
            domainMin: undefined,
            domainMax: undefined,
          },
          axis: { ticks: options.ticks, labels: options.tickLabels },
        },
        tooltip: options.showTooltips
          ? [
              {
                field: 'x_title',
                title: ' ',
              },
              // {
              //   field: 'x',
              //   type: 'quantitative',
              //   title: options.xtitle,
              // },
              {
                field: 'y_title',
                title: '  ', // must be unique?
              },
              // {
              //   field: 'y',
              //   type: 'quantitative',
              //   title: options.ytitle,
              // },
            ]
          : false,
        opacity: {
          condition: [
            {
              selection: 'highlight',
              value: 1,
            },
            {
              test: 'datum.time_value == highlightTimeValue',
              value: 1,
            },
          ],
          value: 0.2,
        },
      },
    };

    let spec = chartSpec;
    spec = {
      width: width,
      height: height,
      padding: options.padding != null ? options.padding : null,
      title: options.showTitle ? `Lag: ${lag} days` : '',
      transform: [
        {
          window: [
            {
              op: 'lag',
              param: lag >= 0 ? lag : 0,
              field: 'date_value',
              as: 'x_date',
            },
            {
              op: 'lag',
              param: lag >= 0 ? lag : 0,
              field: row,
              as: 'x',
            },
            {
              op: 'lag',
              param: lag <= 0 ? -lag : 0,
              field: 'date_value',
              as: 'y_date',
            },
            {
              op: 'lag',
              param: lag <= 0 ? -lag : 0,
              field: column,
              as: 'y',
            },
          ],
        },
        { as: 'x_title', calculate: `"${options.xtitle} (" + timeFormat(datum.x_date, "%b %d") + "): " + datum.x` },
        { as: 'y_title', calculate: `"${options.ytitle} (" + timeFormat(datum.y_date, "%b %d") + "): " + datum.y` },
      ],
      layer: [
        chartSpec,

        ...(options.showRSquared
          ? [
              {
                transform: [
                  {
                    regression: 'x',
                    on: 'y',
                    params: true,
                  },
                  { calculate: "'R²: '+format(datum.rSquared, '.2f')", as: 'R2' },
                ],
                mark: {
                  type: 'text',
                  color: 'firebrick',
                  align: 'right',
                  x: 'width',
                  y: -5,
                  size: 14,
                },
                encoding: {
                  text: { type: 'nominal', field: 'R2' },
                },
              },
            ]
          : []),

        {
          transform: [
            {
              window: [
                {
                  op: 'mean',
                  field: 'x',
                  type: 'quantitative',
                  as: 'xmean',
                },
              ],
              frame: [-6, 0],
            },
            {
              window: [
                {
                  op: 'mean',
                  field: 'y',
                  type: 'quantitative',
                  as: 'ymean',
                },
              ],
              frame: [-6, 0],
            },
          ],
          layer: [
            // Draw hairs for the snake: interesting, but mostly just adds noise.
            // {
            //   mark: {
            //     type: 'rule',
            //     opacity: 0.2,
            //   },
            //   encoding: {
            //     x: { field: 'x', type: 'quantitative' },
            //     y: { field: 'y', type: 'quantitative' },
            //     x2: { field: 'xmean', type: 'quantitative' },
            //     y2: { field: 'ymean', type: 'quantitative' },
            //   },
            // },

            // Draw the "snake" line, a 7-day moving average of the points.
            {
              // Get next (or previous?) point along mean, to draw rule.
              transform: [
                { window: [{ op: 'lag', param: 1, field: 'xmean', as: 'nextx' }] },
                { window: [{ op: 'lag', param: 1, field: 'ymean', as: 'nexty' }] },
              ],
              mark: {
                type: 'rule',
                color: 'gray',
                opacity: 0.7,
              },
              selection: {
                highlightSnake: {
                  type: 'single',
                  empty: 'none',
                  on: 'mouseover',
                  clear: 'mouseout',
                },
              },
              encoding: {
                x2: { field: 'nextx', type: 'quantitative' },
                y2: { field: 'nexty', type: 'quantitative' },
                x: { field: 'xmean', type: 'quantitative' },
                y: { field: 'ymean', type: 'quantitative' },
                tooltip: options.showTooltips
                  ? [
                      {
                        field: 'x_title',
                        title: ' ',
                      },
                      {
                        field: 'y_title',
                        title: '  ', // must be unique?
                      },
                    ]
                  : false,
                opacity: {
                  condition: [
                    {
                      selection: 'highlightSnake',
                      value: 1,
                    },
                  ],
                  value: 0.7,
                },
                size: {
                  field: 'date_value',
                  type: 'temporal',
                  scale: { range: [0, 6] },
                  legend: sizeLegend
                    ? {
                        symbolType: 'square',
                        symbolStrokeWidth: 3,
                        symbolFillColor: 'gray',
                        title: 'Date',
                      }
                    : null,
                },
              },
            },

            // Draw the linear regression line.
            {
              transform: [
                {
                  regression: 'x',
                  on: 'y',
                  // params: true,
                },
                // { calculate: 'datum.rSquared * 100', as: 'r2' },
              ],
              mark: {
                type: 'line',
                strokeWidth: 2,
                color: 'firebrick',
                // color: {
                //   expr: 'scale'
                //   // field: 'r2',
                //   // round: false,
                //   // type: 'quantitative',
                //   // scale: { scheme: 'orangered' },
                // },
                tooltip: true,
              },
              encoding: {
                x: {
                  field: 'x',
                  type: 'quantitative',
                  scale: {
                    domainMin: undefined,
                    domainMax: undefined,
                  },
                },
                y: {
                  field: 'y',
                  type: 'quantitative',
                  scale: {
                    domainMin: undefined,
                    domainMax: undefined,
                  },
                },
                // opacity: {
                //   field: 'r2',
                //   round: false,
                //   type: 'quantitative',
                //   //scale: { domain: [0, 1] },
                // },
                // color: {
                //   field: 'r2',
                //   round: false,
                //   type: 'quantitative',
                //   scale: { scheme: 'orangered' },
                // },
                // color: {
                //   field: 'rSquared',
                //   round: false,
                //   type: 'quantitative',
                //   scale: { scheme: 'orangered' },
                // },
              },
            },
          ],
        },
      ],
    };
    return spec;
  }

  $: matrixSpec = [];

  function updateMatrixSpec(vegaRepeatSpec, lag = 0) {
    const specs = vegaRepeatSpec.rows
      .map((r) => {
        const c = vegaRepeatSpec.columns[0];
        return [
          ...[
            makeMatrixCellSpec(r.key, c.key, {
              histogram: r == c, // obsolete
              showTitle: true,
              axisTitles: true,
              ticks: false,
              tickLabels: true,
              xtitle: r.name,
              ytitle: c.name,
              lag,
              showTooltips: false,
              showRSquared: false,
              ...options,
            }),
          ],
        ].flat();
      })
      .flat();
    let matrixSpec = {
      columns: 1, // vegaRepeatSpec.columns.length,
      concat: [specs[1]],
    };
    // console.info('matrix', matrixSpec);
    return matrixSpec;
  }

  $: vegaRepeatSpec = { rows: otherSensors, columns: otherSensors };

  $: {
    matrixSpec = updateMatrixSpec(vegaRepeatSpec, lag);
  }

  $: splomSpec = makeSplomSpec(matrixSpec);

  function makeSplomSpec(matrixSpec) {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      padding: options.padding != null ? options.padding : { left: 10, right: 50, top: 10, bottom: 10 },
      data: { name: 'values' },

      ...matrixSpec,
    };
  }
</script>

<style>
  .card {
    margin: 0.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .uk-card-header {
    position: relative;
    align-self: stretch;
  }

  .toolbar {
    position: absolute;
    right: 0.5em;
    top: 50%;
    transform: translate(0, -50%);
  }

  .grow {
    flex: 1 1 0;
  }

  .vega-wrapper {
    align-self: stretch;
    flex: 0 0 8em;
    position: relative;
  }

  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 2px;
    bottom: 0;
  }

  .key {
    margin: 0;
    margin-left: 1em;
    padding: 0.5em;
    max-width: 30em;
    line-height: 1.1em;
  }

  .key-fact {
    margin-left: 1em;
    font-weight: bold;
    text-align: right;
    padding-right: 1em;
    width: 70px;
    height: 50px;
  }

  .legend::before {
    color: var(--color);
    content: '\25FC';
    padding-right: 0.2em;
  }

  .hint {
    margin-left: 1em;
    vertical-align: middle;
  }

  .key.single .legend {
    display: none;
    width: 0;
  }
  .key.single td {
    border: none;
  }

  /* Note that for table layout, the exact width doesn't matter, 
     but the relative proportion between column widths does. */
  .key .valueCol {
    width: 50px;
  }

  .key .dateCol {
    width: 30px;
  }

  .key.single .locationCol {
    width: 60px;
  }

  .key.single .dateCol {
    width: 30px;
  }
</style>

<div class="root" on:click>
  <Vega
    data={Promise.resolve(sensorMatrixData)}
    spec={splomSpec}
    signals={{ currentDate: date, highlightTimeValue }}
    signalListeners={['highlight']}
    on:signal={onHighlight} />
</div>
