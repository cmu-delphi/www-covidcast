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

  $: sensorListData = sensorList.slice(0, 4).map((sensor) => prepareSensorData(sensor, selections, startDay, endDay));
  $: sensorDataPromises = sensorListData.map((sensorData) => sensorData.data);
  $: sensorMatrixData = loadAllSignalData(sensorDataPromises);

  $: vegaRepeatSpec = { row: [], column: [] };

  $: splomSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',

    // autosize: {
    //   type: 'none',
    //   contains: 'padding',
    //   resize: true,
    // },
    // padding: { left: 20, right: 2, top: 50, bottom: 5 },
    width: 500,
    height: 800,

    data: { name: 'values' },

    repeat: vegaRepeatSpec,
    spec: {
      mark: 'point',
      // Selection for pan and zoom
      // selection: {
      //   brush: {
      //     type: 'interval',
      //     resolve: 'union',
      //     on: '[mousedown[event.shiftKey], window:mouseup] > window:mousemove!',
      //     translate: '[mousedown[event.shiftKey], window:mouseup] > window:mousemove!',
      //     zoom: 'wheel![event.shiftKey]',
      //   },
      //   grid: {
      //     type: 'interval',
      //     resolve: 'global',
      //     bind: 'scales',
      //     translate: '[mousedown[!event.shiftKey], window:mouseup] > window:mousemove!',
      //     zoom: 'wheel![!event.shiftKey]',
      //   },
      // },
      selection: {
        brush: {
          type: 'interval',
        },
      },
      encoding: {
        x: { field: { repeat: 'column' }, type: 'quantitative', axis: { minExtent: 20 } },
        y: {
          field: { repeat: 'row' },
          type: 'quantitative',
          axis: { minExtent: 30 },
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
    },
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
