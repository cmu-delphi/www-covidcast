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
  let otherSensors = [sensor, $currentSensorEntry];

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
    // console.info('makeMatrixCellSpec options', options);
    let xBin = {};
    let yAggregate = null;

    const lag = options.lag || 0;
    const width = options.width || 100;
    const height = options.height || 100;
    const sizeLegend = options.sizeLegend || null;

    // console.info('width', width, 'height', height);
    const chartSpec = {
      width: width,
      height: height,
      //       transform: [
      //   {
      //     calculate: `toDate(date)`,
      //     as: 'date_value',
      //   },
      // ],
      mark: {
        type: 'point', // options.histogram ? 'bar' : 'point',
        tooltip: true, // debug: { content: 'data' },
      },
      transform: [
        { as: 'x_title', calculate: `"${options.xtitle} (" + timeFormat(datum.x_date, "%b %d") + "): " + datum.x` },
        { as: 'y_title', calculate: `"${options.ytitle} (" + timeFormat(datum.y_date, "%b %d") + "): " + datum.y` },
      ],
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
          ...xBin,
        },
        y: yAggregate || {
          field: 'y',
          title: options.axisTitles ? options.ytitle : '',
          type: 'quantitative',
          scale: {
            domainMin: undefined,
            domainMax: undefined,
          },
        },
        tooltip: [
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
        ],
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
        //     color: {
        //       condition: [

        //       ],
        //       data: {
        //   values: [{ date_value: null }],
        // },

        //       value: 'blue'
        //     }
      },
    };
    let spec = chartSpec;
    spec = {
      width: width,
      height: height,
      title: lag != 0 ? `Lag: ${lag} days` : '',
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
      ],
      layer: [
        chartSpec,

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
            x: 'width',
            align: 'right',
            y: -5,
          },
          encoding: {
            text: { type: 'nominal', field: 'R2' },
          },
        },
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
          mark: {
            type: 'trail',
            opacity: 0.7,
            color: 'gray',
          },
          encoding: {
            x: { field: 'xmean', type: 'quantitative', sort: null },
            y: {
              field: 'ymean',
              type: 'quantitative',
              sort: null,
              scale: {
                domainMin: undefined,
              },
            },
            // color: { field: 'date_value', type: 'temporal',         scale:  },
            size: {
              field: 'date_value',
              type: 'temporal',
              scale: { range: [0, 6] },
              legend: sizeLegend
                ? {
                    // orient: 'bottom',
                  }
                : null,
            },
          },
        },
        {
          transform: [
            {
              regression: 'x',
              on: 'y',
            },
          ],
          mark: { type: 'line', color: 'firebrick' },
          encoding: {
            x: {
              field: 'x',
              type: 'quantitative',
              ...xBin,
            },
            y: yAggregate || {
              field: 'y',
              type: 'quantitative',
              scale: {
                domainMin: undefined,
              },
            },
          },
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
              axisTitles: true,
              xtitle: r.name,
              ytitle: c.name,
              lag,
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
      padding: { left: 10, right: 50, top: 10, bottom: 10 },
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
