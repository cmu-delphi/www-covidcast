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
  import { currentSensorEntry, smallMultipleTimeSpan } from '../../stores';
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
  let otherSensors = [$currentSensorEntry];
  // $: primary = $currentSensorEntry;
  // $: {
  //   otherSensors.push(primary);
  // }

  let chosenColumn = ''; // Sensor chosen by user from menu.
  $: {
    if (chosenColumn) {
      const chosenSensor = sensorList.find((d) => d.key === chosenColumn);
      otherSensors = otherSensors.concat([chosenSensor]);
      chosenColumn = '';
      console.info('otherSensors', otherSensors);
    }
  }
  function loadAllSignalData(sensorPromises) {
    // for each time_value, merge data values across sensors.
    const sensorDateMap = {};
    const sensorKeysMap = {}; // map from sensor key to sensor.
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
          const sensorKey = sensorData.sensor.key;
          sensorKeysMap[sensorKey] = sensorData.sensor;
          sensorDateMap[time_value_key][sensorKey] = row.value;
        });
      });
      console.info('sensorKeysMap', sensorKeysMap);
      console.info('sensorDateMap', sensorDateMap);
      const sensors = Object.values(sensorKeysMap);
      vegaRepeatSpec = {
        rows: sensors,
        columns: sensors, // .reverse(),
      };
      return Object.values(sensorDateMap);
    });
  }
  // $: sensorListData = sensorList.slice(0, 4).map((sensor) => prepareSensorData(sensor, selections, startDay, endDay));
  $: sensorListData = otherSensors.map((sensor) => prepareSensorData(sensor, selections, startDay, endDay));
  $: sensorDataPromises = sensorListData.map((sensorData) => sensorData.data);
  $: sensorMatrixData = loadAllSignalData(sensorDataPromises);
  $: vegaRepeatSpec = { rows: [], columnc: [] };

  // row and column are field names as keys.
  function makeMatrixCellSpec(row, column, options) {
    let xBin = {};
    let yAggregate = null;
    if (options.histogram) {
      xBin = { bin: true };
      yAggregate = { aggregate: 'count', title: 'Count' };
    }
    const chartSpec = {
      // height: 200,
      // width: 200,
      // title: { text: options.xtitle, orient: 'left', color: 'black' },

      mark: options.histogram ? 'bar' : 'point',
      // selection: {
      //   brush: {
      //     type: 'interval',
      //     mark: { cursor: 'move' },
      //   },
      // },
      encoding: {
        x: {
          field: column,
          title: options.xtitle,
          type: 'quantitative',
          ...xBin,
        },
        y: yAggregate || {
          field: row,
          title: options.ytitle,
          type: 'quantitative',
        },
      },
    };
    let spec = chartSpec;
    if (!options.histogram) {
      spec = {
        // width: 200,
        // height: 200,
        layer: [
          {
            transform: [
              {
                window: [
                  {
                    op: 'mean',
                    field: column,
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
                    field: row,
                    type: 'quantitative',
                    as: 'ymean',
                  },
                ],
                frame: [-6, 0],
              },
            ],
            mark: {
              type: 'trail',
              opacity: 0.5,
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
              },
            },
          },
          chartSpec,
        ],
      };
    }
    return spec;
  }
  $: matrixSpec = [];
  $: {
    // const numRows = vegaRepeatSpec.rows.length;
    // const numCols = vegaRepeatSpec.columns.length;
    matrixSpec = {
      columns: 1, // vegaRepeatSpec.columns.length,
      concat: [
        ...vegaRepeatSpec.rows
          .map((r) => {
            const c = vegaRepeatSpec.columns[0];
            return [
              ...[makeMatrixCellSpec(r.key, c.key, { histogram: r == c, xtitle: r.name, ytitle: c.name })],
            ].flat();
          })
          .flat(),
      ],
    };
    console.info('matrix', matrixSpec);
  }
  $: splomSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    // title: 'correlations',
    // autosize: {
    //   type: 'fixed',
    //   contains: 'padding',
    //   resize: true,
    // },
    padding: { left: 50, right: 40, top: 50, bottom: 50 },
    width: 500,
    height: 900,
    data: { name: 'values' },
    ...matrixSpec,
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
      <button type="button" aria-label="add column options">Add Indicator</button>
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
