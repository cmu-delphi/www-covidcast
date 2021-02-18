<script>
  import Search from '../../components/Search.svelte';
  import { nameInfos } from '../../maps';
  import {
    addCompare,
    // currentDateObject,
    currentRegionInfo,
    currentMultiSelection,
    removeCompare,
    selectByInfo,
  } from '../../stores';
  import { sensorList } from '../../stores/constants';
  // import SensorCard from './SensorCard.svelte';
  import { selectionColors } from '../../theme';
  // import { onHighlight } from '../overview/vegaSpec';
  // import { highlightTimeValue } from '../../stores';
  import { prepareSensorData } from '../overview/vegaSpec';
  import { smallMultipleTimeSpan } from '../../stores';
  import Vega from '../../components/Vega.svelte';
  import { groupedSensorList } from '../../stores/constants';

  $: selectedLevels = new Set($currentMultiSelection.map((d) => d.info.level));
  function filterItem(item) {
    return selectedLevels.size === 0 || selectedLevels.has(item.level);
  }

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
  let selections = $currentMultiSelection;

  /**
   * @type {import('../../stores/constants').SensorEntry[]}
   */
  let otherSensors = [];

  let chosenColumn = '';

  $: {
    if (chosenColumn) {
      otherSensors = otherSensors.concat([sensorList.find((d) => d.key === chosenColumn)]);
      chosenColumn = '';
      console.info('otherSensors', otherSensors);
    }
  }

  function loadAllSignalData(sensorPromises) {
    // for each time_value, merge data values across sensors.
    const sensorDateMap = {};
    const sensorKeysMap = {};
    return Promise.all(sensorPromises).then((sensorsDataRows) => {
      console.info('sensorsDataRows', sensorsDataRows);
      sensorsDataRows.forEach((sensorRows, index) => {
        const sensorData = sensorListData[index];
        console.info('index', index, 'sensorData', sensorData, 'sensorRows', sensorRows);
        sensorRows.forEach((row) => {
          const time_value_key = String(row.time_value);
          if (!sensorDateMap[time_value_key]) {
            sensorDateMap[time_value_key] = { ...row };
          }
          sensorKeysMap[sensorData.sensor.key] = true;
          sensorDateMap[time_value_key][sensorData.sensor.key] = row.value;
        });
      });
      console.info('sensorDateMap', sensorDateMap);
      vegaRepeatSpec = {
        row: Object.keys(sensorKeysMap),
        column: Object.keys(sensorKeysMap).reverse(),
      };
      return Object.values(sensorDateMap);
    });
  }

  // $: sensorListData = sensorList.slice(0, 4).map((sensor) => prepareSensorData(sensor, selections, startDay, endDay));
  $: sensorListData = otherSensors.map((sensor) => prepareSensorData(sensor, selections, startDay, endDay));

  $: sensorDataPromises = sensorListData.map((sensorData) => sensorData.data);
  $: sensorMatrixData = loadAllSignalData(sensorDataPromises);

  $: vegaRepeatSpec = { row: [], column: [] };

  function makeMatrixCellSpec(row, column, options) {
    let xBin = {};
    let yAggregate = null;
    if (options.histogram) {
      xBin = { bin: true };
      yAggregate = { aggregate: 'count' };
    }
    const chartSpec = {
      // height: 200,
      // width: 200,
      // title: { text: options.xtitle, orient: 'left', color: 'black' },
      // facet: {
      //   field: 'title whatever',
      //   type: 'ordinal',
      // },
      // spec: {
      mark: options.histogram ? 'bar' : 'point',

      selection: {
        brush: {
          type: 'interval',
          mark: { cursor: 'move' },
        },
      },
      encoding: {
        x: {
          field: column,
          type: 'quantitative',
          ...xBin,
          // axis: { minExtent: 20 },
          // axis: null,
          // axis: {
          //   title: null,
          //   // minExtent: 10,
          //   // maxExtent: 0,
          // },
        },
        y: yAggregate || {
          field: row,
          type: 'quantitative',
          // axis: { minExtent: 30 },
          // axis: null,
          // axis: {
          //   title: null,
          //   // minExtent: 10,
          //   // maxExtent: 0,
          // },
        },
        color: {
          condition: {
            selection: 'brush',
            field: 'brush',
            type: 'nominal',
          },
          value: 'grey',
        },
      },
      // },
    };
    let spec = chartSpec;
    // if (options.xtitle) {
    //   spec = {
    //     vconcat: [
    //       chartSpec,
    //       // {
    //       //   mark: {
    //       //     type: 'text',
    //       //     text: options.xtitle,
    //       //   },
    //       //   encoding: {
    //       //     text: {
    //       //       value: options.xtitle,
    //       //     },
    //       //     x: { value: 0 },
    //       //     Y: { value: 0 },
    //       //   },
    //       // },
    //     ],
    //   };
    // }
    return spec;
  }

  $: matrixSpec = [];
  $: {
    // const numRows = vegaRepeatSpec.row.length;
    // const numCols = vegaRepeatSpec.column.length;
    matrixSpec = {
      columns: vegaRepeatSpec.column.length,
      hconcat: [
        ...vegaRepeatSpec.row
          .map((r) => {
            // const rowTitle = rowIndex == numRows - 1 ? r.row : '';
            return [
              ...vegaRepeatSpec.column.map((c) => {
                // const colTitle = colIndex == numCols - 1 ? r.column : '';
                return makeMatrixCellSpec(r, c, { histogram: r == c }); // ytitle: colTitle, xtitle: rowTitle
              }),
              // {
              //   title: 'testing',
              //   mark: {
              //     type: 'text',
              //     text: 'mark title',
              //   },
              // },
            ].flat();
          })
          .flat(),
      ],
    };
    console.info('matrix', matrixSpec);
  }

  $: splomSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    title: 'correlations',
    // autosize: {
    //   type: 'fixed',
    //   contains: 'padding',
    //   resize: true,
    // },
    padding: { left: 50, right: 40, top: 50, bottom: 50 },
    // width: 500,
    // height: 800,

    data: { name: 'values' },
    ...matrixSpec,
    // vconcat: [
    //   {
    // repeat: vegaRepeatSpec,
    // spec: {
    //   height: 200,
    //   width: 200,
    //   mark: 'point',

    //   selection: {
    //     brush: {
    //       type: 'interval',
    //     },
    //   },
    //   encoding: {
    //     x: {
    //       field: { repeat: 'column' },
    //       type: 'quantitative',
    //       // axis: { minExtent: 20 },
    //       // axis: null,
    //       axis: {
    //         title: null,
    //         minExtent: 10,
    //         maxExtent: 0,
    //       },
    //     },
    //     y: {
    //       field: { repeat: 'row' },
    //       type: 'quantitative',
    //       // axis: { minExtent: 30 },
    //       // axis: null,
    //       axis: {
    //         title: null,
    //         minExtent: 10,
    //         maxExtent: 0,
    //       },
    //     },
    //     color: {
    //       condition: {
    //         selection: 'brush',
    //         field: 'brush',
    //         type: 'nominal',
    //       },
    //       value: 'grey',
    //     },
    //   },
    // },
  };
</script>

<style>
  .root {
    flex: 1 1 0;
    margin: 0.5em;
    display: flex;
    flex-direction: column;
  }

  .search-container {
    align-self: center;
    width: 100%;
    height: 100%;
    margin-bottom: 1em;
  }

  .add-column-container {
    min-width: 40px;
  }
  .add-sensor-button-wrapper {
    min-width: 40px;
  }
  .grid-wrapper {
    flex: 1 1 0;
    overflow: auto;
    position: relative;
  }

  .card-grid {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  .card-grid > :global(*) {
    width: 30em;
  }

  /** mobile **/
  @media only screen and (max-width: 60em) {
    .card-grid > :global(*) {
      width: 50em;
    }
    .search-container {
      align-self: stretch;
      width: unset;
    }
  }

  /** mobile **/
  @media only screen and (max-width: 40em) {
    .card-grid {
      display: block;
    }
    .card-grid > :global(*) {
      width: unset;
    }
  }

  .wide-card-grid {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  .wide-card-grid > :global(*) {
    width: 400px;
  }
</style>

<div class="root base-font-size">
  <div class="uk-table-shrink add-column-container">
    <div class="add-sensor-button-wrapper" uk-form-custom="target: true">
      <select bind:value={chosenColumn}>
        {#each groupedSensorList as sensorGroup}
          <optgroup label={sensorGroup.label}>
            {#each sensorGroup.sensors as sensor}
              <option
                disabled={otherSensors.includes(sensor)}
                title={typeof sensor.tooltipText === 'function' ? sensor.tooltipText() : sensor.tooltipText}
                value={sensor.key}>
                {sensor.name}
              </option>
            {/each}
          </optgroup>
        {/each}
      </select>
      <button type="button" aria-label="add column options">Add Sensor</button>
    </div>
  </div>

  <div class="search-container">
    <Search
      placeholder={$currentRegionInfo ? 'Compare with...' : 'Search for a location...'}
      items={nameInfos}
      selectedItems={$currentMultiSelection}
      labelFieldName="displayName"
      maxItemsToShowInList="5"
      colorFieldName="color"
      {filterItem}
      maxSelections={Math.min(selectionColors.length + 1, 4)}
      on:add={(e) => addCompare(e.detail)}
      on:remove={(e) => removeCompare(e.detail.info)}
      on:change={(e) => selectByInfo(e.detail)} />

    <Vega data={Promise.resolve(sensorMatrixData)} spec={splomSpec} />
  </div>
</div>
