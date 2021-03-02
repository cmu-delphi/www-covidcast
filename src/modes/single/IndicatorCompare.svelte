<script>
  // import VegaTooltip from '../../components/DetailView/VegaTooltip.svelte';
  import InfoDialogButton from '../../components/InfoDialogButton.svelte';
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
      console.info('otherSensors', otherSensors);
    }
  }
  // function loadAllSignalData(sensorPromises) {
  //   // for each time_value, merge data values across sensors.
  //   const sensorDateMap = {};
  //   const sensorKeysMap = {}; // map from sensor key to sensor.
  //   return Promise.all(sensorPromises).then((sensorsDataRows) => {
  //     console.info('sensorsDataRows', sensorsDataRows);
  //     sensorsDataRows.forEach((sensorRows, index) => {
  //       const sensorData = sensorListData[index];
  //       console.info('index', index, 'sensorData', sensorData, 'sensorRows', sensorRows);
  //       sensorRows.forEach((row) => {
  //         const time_value_key = String(row.time_value);
  //         if (!sensorDateMap[time_value_key]) {
  //           sensorDateMap[time_value_key] = { ...row };
  //         }
  //         const sensorKey = sensorData.sensor.key;
  //         sensorKeysMap[sensorKey] = sensorData.sensor;
  //         sensorDateMap[time_value_key][sensorKey] = row.value;
  //       });
  //     });
  //     console.info('sensorKeysMap', sensorKeysMap);
  //     console.info('sensorDateMap', sensorDateMap);
  //     const sensors = Object.values(sensorKeysMap);
  //     vegaRepeatSpec = {
  //       rows: sensors,
  //       columns: sensors, // .reverse(),
  //     };
  //     return Object.values(sensorDateMap);
  //   });
  // }
  // $: sensorListData = sensorList.slice(0, 4).map((sensor) => prepareSensorData(sensor, selections, startDay, endDay));
  // $: sensorListData = otherSensors.map((sensor) => prepareSensorData(sensor, selections, startDay, endDay));
  // $: sensorDataPromises = sensorListData.map((sensorData) => sensorData.data);
  // $: sensorMatrixData = loadAllSignalData(sensorDataPromises);

  // row and column are field names as keys.
  function makeMatrixCellSpec(row, column, options) {
    let xBin = {};
    let yAggregate = null;
    // if (options.histogram) {
    //   xBin = { bin: true };
    //   yAggregate = { aggregate: 'count', title: 'Count' };
    // }
    const lag = options.lag || 0;
    const chartSpec = {
      // height: 200,
      // width: 200,
      // title: { text: options.xtitle, orient: 'left', color: 'black' },
      // transform: [
      //   {
      //     window: [
      //       {
      //         op: 'lag',
      //         param: 0,
      //         field: column,
      //         as: 'x',
      //       },
      //       {
      //         op: 'lag',
      //         param: 0,
      //         field: row,
      //         as: 'y',
      //       },
      //     ],
      //   },
      // ],
      mark: {
        type: 'point', // options.histogram ? 'bar' : 'point',
        opacity: 0.2,
      },
      // selection: {
      //   brush: {
      //     type: 'interval',
      //     mark: { cursor: 'move' },
      //   },
      // },
      encoding: {
        x: {
          field: 'x',
          // title: options.xtitle,
          title: null,
          type: 'quantitative',
          ...xBin,
        },
        y: yAggregate || {
          field: 'y',
          // title: options.ytitle,
          title: null,
          type: 'quantitative',
        },
      },
    };
    let spec = chartSpec;
    //if (!options.histogram) {
    spec = {
      // width: 200,
      // height: 200,
      width: 100,
      height: 100,
      title: lag != 0 ? `Lag: ${lag}` : '',
      transform: [
        {
          window: [
            {
              op: 'lag',
              param: lag >= 0 ? lag : 0,
              field: column,
              as: 'x',
            },
            {
              op: 'lag',
              param: lag <= 0 ? -lag : 0,
              field: row,
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
            y: { field: 'ymean', type: 'quantitative', sort: null },
            // color: { field: 'date_value', type: 'temporal',         scale:  },
            size: {
              field: 'date_value',
              type: 'temporal',
              scale: { range: [0, 6] },
              legend: null,
            },
          },
        },
      ],
      //    };
    };
    return spec;
  }

  $: matrixSpec = [];

  function updateMatrixSpec(vegaRepeatSpec, lag = 0) {
    // const numRows = vegaRepeatSpec.rows.length;
    // const numCols = vegaRepeatSpec.columns.length;

    const specs = vegaRepeatSpec.rows
      .map((r) => {
        const c = vegaRepeatSpec.columns[0];
        return [
          ...[
            makeMatrixCellSpec(r.key, c.key, {
              histogram: r == c, // obsolete
              xtitle: c.name,
              ytitle: r.name,
              lag: lag,
            }),
          ],
        ].flat();
      })
      .flat();
    matrixSpec = {
      columns: 1, // vegaRepeatSpec.columns.length,
      concat: [specs[1]],
    };
    console.info('matrix', matrixSpec);
    return matrixSpec;
  }

  $: vegaRepeatSpec = { rows: otherSensors, columns: otherSensors };

  $: {
    matrixSpec = updateMatrixSpec(vegaRepeatSpec);
  }

  $: splomSpec = makeSplomSpec(matrixSpec);

  function makeSplomSpec(matrixSpec) {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      // title: 'correlations',
      // autosize: {
      //   type: 'fixed',
      //   contains: 'padding',
      //   resize: true,
      // },
      padding: { left: 50, right: 40, top: 50, bottom: 50 },
      width: 30,
      height: 30,
      data: { name: 'values' },

      ...matrixSpec,
    };
  }

  let showLags = false;
  let showLag = 0;

  function onChangeLag(event) {
    showLag = event.currentTarget.value;
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

<tr>
  <td>
    <div class="uk-card-header">
      <h3 class="uk-card-title uk-margin-remove-bottom">{sensor.plotTitleText}</h3>
      <div class="toolbar">
        <InfoDialogButton {sensor} />
      </div>
    </div>
  </td>

  <td>
    <main class="vega-wrapper">
      <Vega data={Promise.resolve(sensorMatrixData)} spec={splomSpec} />
    </main>
    <table style="visibility:invisible" class="key" class:single={selections.length === 1}>
      <colgroup>
        <col class="locationCol" />
        <col class="valueCol" />
        <col class="dateCol" />
      </colgroup>
      <tbody>
        <!-- Need tbody to size the container table and its td?
        {#each selections as selection, i}
          
             <tr>
              <td class="legend" style="--color: {i === 0 ? 'grey' : selection.color}">{selection.displayName}</td>
            <td class="key-fact">{values[i] != null ? sensor.formatValue(values[i]) : '?'}</td>
             {#if i === 0}
              <td class="hint" rowspan={selections.length}>
                on
                {formatDateLocal(highlightDate ? highlightDate : date)}
              </td>
            {/if}
          </tr> 
        {/each}
        -->
      </tbody>
    </table>
  </td>
  <td><input id="showLags" type="checkbox" bind:checked={showLags} />Lags</td>
</tr>

{#if showLags}
  <tr>
    <td>
      {#each [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7] as lag}
        <Vega data={Promise.resolve(sensorMatrixData)} spec={makeSplomSpec(updateMatrixSpec(vegaRepeatSpec, lag))} />
        <input checked={showLag === lag} on:change={onChangeLag} type="radio" name="lagDetails" value={lag} />
      {/each}
    </td>
    <td style="width: 100px; height: 100px;">
      {#if showLag}
        <Vega
          data={Promise.resolve(sensorMatrixData)}
          spec={makeSplomSpec(updateMatrixSpec(vegaRepeatSpec, showLag))} />
      {/if}
    </td>
  </tr>
{/if}
