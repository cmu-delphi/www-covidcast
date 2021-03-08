<script>
  import Search from '../../components/Search.svelte';
  import { nameInfos } from '../../maps';
  import {
    addCompare,
    currentDateObject,
    currentRegionInfo,
    currentMultiSelection,
    removeCompare,
    selectByInfo,
  } from '../../stores';
  // import { get } from 'svelte/store';
  import { sensorList } from '../../stores/constants';
  // import { groupedSensorList } from '../../stores/constants';

  import InfoDialogButton from '../../components/InfoDialogButton.svelte';

  // import SensorCard from './SensorCard.svelte';
  import IndicatorCompare from './IndicatorCompare.svelte';
  import { selectionColors } from '../../theme';
  import { onHighlight, prepareSensorData } from '../overview/vegaSpec';
  import { highlightTimeValue, smallMultipleTimeSpan } from '../../stores';
  // import { formatAPITime, parseAPITime } from '../../data';

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
  let otherSensors = sensorList; //[$currentSensorEntry];
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

  $: showLagsForSensor = null;

  function onShowLags(sensor) {
    showLagsForSensor = null;
    // Need a timeout in order to update the lags list.
    // TODO: figure out how to avoid this timeout.
    setTimeout(() => {
      showLagsForSensor = sensor;
      showLagDetailsForSensor = null;
      console.info('onShowLags', sensor);
    }, 500);
  }

  $: showLagDetailsForSensor = null;
  $: sensorDetailsLag = 0;

  function onShowLagDetails(sensor, lag) {
    showLagDetailsForSensor = sensor;
    sensorDetailsLag = lag;
    console.info('onShowLagDetails', sensor, lag);
  }
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
    width: 60em;
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
  </div>

  <div class="grid-wrapper">
    <div class="card-grid">
      <table style="width: 100%">
        <tr>
          <td style="width:40%; vertical-align: top">
            <table>
              {#each otherSensors as sensor (sensor.key)}
                <tr>
                  <td>
                    <div class="uk-card-header">
                      <h3 class="uk-card-title uk-margin-remove-bottom" style="font-size: 1rem">
                        {sensor.plotTitleText}
                        <div class="toolbar">
                          <InfoDialogButton {sensor} />
                        </div>
                      </h3>
                    </div>
                  </td>

                  <td style="width: 100px; height: 100px">
                    <IndicatorCompare
                      {sensorMatrixData}
                      {sensor}
                      on:click={onShowLags(sensor)}
                      date={$currentDateObject}
                      selections={$currentMultiSelection}
                      {onHighlight}
                      highlightTimeValue={$highlightTimeValue} />
                  </td>
                </tr>
              {/each}
            </table>
          </td>
          <td style="width:100px; vertical-align: top">
            {#if showLagsForSensor}
              <h4>Lags with {showLagsForSensor.name}</h4>
              <table style="width:100%">
                {#each [-28, -21, -14, -7, -4, -1, 0, 1, 4, 7, 14, 21, 28] as lag}
                  <tr>
                    <td style="width: 100px; height: 100px">
                      <IndicatorCompare
                        {sensorMatrixData}
                        sensor={showLagsForSensor}
                        {lag}
                        on:click={onShowLagDetails(showLagsForSensor, lag)}
                        date={$currentDateObject}
                        selections={$currentMultiSelection}
                        {onHighlight}
                        highlightTimeValue={$highlightTimeValue} />
                      <!-- spec={makeSplomSpec(updateMatrixSpec(vegaRepeatSpec, lag, 50, 50))}  -->
                    </td>
                  </tr>
                {/each}
              </table>
            {/if}
          </td>
          <td style="width: 400px; height: 400px; vertical-align: top">
            {#if showLagDetailsForSensor}
              <IndicatorCompare
                {sensorMatrixData}
                sensor={showLagDetailsForSensor}
                lag={sensorDetailsLag}
                options={{ width: 400, height: 400 }}
                on:click={onShowLagDetails(showLagsForSensor, sensorDetailsLag)}
                date={$currentDateObject}
                selections={$currentMultiSelection}
                {onHighlight}
                highlightTimeValue={$highlightTimeValue} />
              <!-- spec={makeSplomSpec(updateMatrixSpec(vegaRepeatSpec, showLag, 200, 200))} -->
            {/if}
          </td>
        </tr>
      </table>
    </div>
  </div>
</div>
