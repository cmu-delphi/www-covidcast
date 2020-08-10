<script>
  import { currentRegion, currentSensor, currentLevel, sensors, currentSensorEntry } from '../stores';
  import { parseAPITime } from '../data/utils';
  import { fetchCustomTimeSlice } from '../data/fetchData';
  import Vega from './vega/Vega.svelte';
  import sensorSingleLineChartSchema from './vega/SmallMultipleLineChart.json';
  import singleLineChartSchema from './vega/SmallMultipleSingleLineChart.json';

  // An array of keys that will NOT be shown in small multiples
  const sensorSmallMultipleBlacklist = [
    'ght-smoothed_search',
    'indicator-combination-confirmed_7dav_incidence_num',
    'indicator-combination-deaths_7dav_incidence_num',
    // 'safegraph-full_time_work_prop',
  ];
  $: filteredSensors = $sensors.filter((s) => !sensorSmallMultipleBlacklist.includes(s.key));

  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200401');
  const finalDay = new Date();

  // Whether we are showing a single metric or everything at once
  let singleView = false;

  function setSingleView(value) {
    singleView = value;
  }

  function toggleSingleView(focusSignal = null) {
    if (!singleView) {
      currentSensor.set(focusSignal);
    }
    singleView = !singleView;
  }

  $: smallMultipleLineCharts = filteredSensors.map((signal) => ({
    key: signal.key,
    name: signal.name,
    tooltipText: signal.tooltipText,
    data: fetchCustomTimeSlice(signal, $currentLevel, $currentRegion, startDay, finalDay),
  }));

  $: singleChartDataPromise = fetchCustomTimeSlice(
    $currentSensorEntry,
    $currentLevel,
    $currentRegion,
    startDay,
    finalDay,
  );
  // patch in the yAxis name
  $: singleLineChartSchemaPatched = {
    ...singleLineChartSchema,
    encoding: {
      ...singleLineChartSchema.encoding,
      y: {
        ...singleLineChartSchema.encoding.y,
        axis: {
          ...singleLineChartSchema.encoding.y.axis,
          title: $currentSensorEntry.yAxis ? $currentSensorEntry.yAxis : ' ',
        },
      },
    },
  };
</script>

<style>
  .small-multiples {
    z-index: 100;
    position: absolute;
    right: 1em;
    bottom: 12px;
    padding: 0.25em;
    width: 68vw;
    max-height: 35vh;
    background-color: white;
  }

  .multiples-charts {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: flex-start;
    flex-direction: row;
    align-content: flex-start;
    /* margin-top: 1.5em; */
    overflow: hidden;
    min-height: 150px;
    max-height: 22vh;
    overflow-y: auto;
  }
  .small-multiples li {
    text-align: left;
    flex: 1 1 18%;
    vertical-align: top;
    margin: 0;
    padding: 0;
    list-style-type: none;
    text-align: center;
    display: flex;
    flex-direction: column;
  }
  .small-multiples li h5 {
    font-size: 12px;
    line-height: 1em;
    text-align: left;
    margin: 0;
    padding: 0;
    padding-left: 0.5em;
    color: #999;
    cursor: pointer;
  }
  .small-multiples li h5:hover {
    text-decoration: underline;
  }

  .button {
    min-width: 110px;
    border-radius: 4px 4px 0 0;
    margin: 0;
    border: 1px solid #dbdbdb;
    padding: 0.5em;
  }

  .button > span {
    text-decoration: underline;
  }

  button.active {
    font-weight: bold !important;
  }

  .small-multiples-topbar h4 {
    font-size: 1.4rem;
  }

  .small-multiples-topbar h4,
  .small-multiples-topbar h5 {
    padding: 0;
    margin: 0.5em 0.25em;
    margin-bottom: 0;
  }

  .small-multiples-tabbar {
    position: absolute;
    height: 32px;
    top: -30px;
    left: 8px;
  }

  .single-chart {
    margin-top: 0.5em;
    width: 95%;
    height: 136px;
    position: relative;
    padding: 0;
    box-sizing: border-box;
  }

  .single-sensor-chart {
    align-self: center;
    height: 55px;
    width: 82%;
    position: relative;
    padding: 0;
    box-sizing: border-box;
  }

  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  .active {
    opacity: 1;
  }
</style>

<div class="small-multiples container-bg">
  <div class="small-multiples-tabbar">
    <div>
      <button on:click={() => setSingleView(false)} class="button" class:active={!singleView}>All indicators</button>

      <button on:click={() => setSingleView(true)} class="button" class:active={singleView}>
        Single indicator:
        <span>{$currentSensorEntry.name}</span>
      </button>
    </div>
  </div>
  <div class="small-multiples-topbar">
    <h4>
      {#if singleView}{$currentSensorEntry.name}{:else}{filteredSensors.length} available indicators{/if}
    </h4>

    <h5 class:hidden={!singleView}>{$currentSensorEntry.tooltipText}</h5>

  </div>

  <div class="single-chart vega-wrapper" class:hidden={!singleView}>
    {#if singleView}
      <Vega data={singleChartDataPromise} schema={singleLineChartSchemaPatched} />
    {/if}
  </div>

  <div class="multiples-charts" class:hidden={singleView}>
    {#each smallMultipleLineCharts as sensor}
      <li>
        <h5 title={sensor.tooltipText} on:click={() => toggleSingleView(sensor.key)}>{sensor.name}</h5>
        <div class="single-sensor-chart vega-wrapper">
          <Vega data={sensor.data} schema={sensorSingleLineChartSchema} />
        </div>
      </li>
    {/each}
  </div>
</div>
