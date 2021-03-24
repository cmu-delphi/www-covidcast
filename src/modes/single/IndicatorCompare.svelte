<script>
  import Vega from '../../components/Vega.svelte';
  import { formatAPITime, parseAPITime } from '../../data';
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

  function makeIndicatorCompareSpec(xKey, yKey, options = {}) {
    const lag = options.lag || 0;
    const width = options.width || 100;
    const height = options.height || 100;
    const sizeLegend = options.sizeLegend || null;

    let spec = {
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
              field: xKey,
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
              field: yKey,
              as: 'y',
            },
          ],
        },
        { as: 'x_title', calculate: `"${options.xtitle} (" + timeFormat(datum.x_date, "%b %d") + "): " + datum.x` },
        { as: 'y_title', calculate: `"${options.ytitle} (" + timeFormat(datum.y_date, "%b %d") + "): " + datum.y` },
      ],
      layer: [
        {
          width: width,
          height: height,
          padding: options.padding != null ? options.padding : null,
          mark: {
            type: 'point',
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
                  {
                    field: 'y_title',
                    title: '  ', // must be unique?
                  },
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
        },

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
                color: {
                  condition: [
                    {
                      selection: 'highlightSnake',
                      value: 'blue',
                    },
                  ],
                  value: 'gray',
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
                },
              ],
              mark: {
                type: 'line',
                strokeWidth: 2,
                color: 'firebrick',
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
              },
            },
          ],
        },
      ],
    };
    return spec;
  }

  function updateIndicatorCompareSpec(lag = 0) {
    const xIndicator = $currentSensorEntry;
    const yIndicator = sensor;
    return makeIndicatorCompareSpec(xIndicator.key, yIndicator.key, {
      showTitle: true,
      axisTitles: true,
      ticks: false,
      tickLabels: true,
      xtitle: xIndicator.name,
      ytitle: yIndicator.name,
      lag,
      showTooltips: false,
      showRSquared: false,
      ...options,
    });
  }

  $: indicatorCompareSpec = topLevelIndicatorCompareSpec(lag);

  function topLevelIndicatorCompareSpec(lag) {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      padding: options.padding != null ? options.padding : { left: 10, right: 50, top: 10, bottom: 10 },
      data: { name: 'values' },

      ...{
        columns: 1,
        concat: [updateIndicatorCompareSpec(lag)],
      },
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
    spec={indicatorCompareSpec}
    signals={{ currentDate: date, highlightTimeValue }}
    signalListeners={['highlight']}
    on:signal={onHighlight} />
</div>
