<script>
  import { currentRegion, currentSensor, currentLevel, sensors, currentSensorEntry } from '../../stores';
  import { parseAPITime } from '../../data/utils';
  import { fetchCustomTimeSlice } from '../../data/fetchData';
  import Vega from '../../components/vega/Vega.svelte';
  import sensorSingleLineChartSpec from '../../components/vega/SmallMultipleLineChart.json';
  import singleLineChartSpec from '../../components/vega/SmallMultipleSingleLineChart.json';

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
  $: singleLineChartSpecPatched = {
    ...singleLineChartSpec,
    encoding: {
      ...singleLineChartSpec.encoding,
      y: {
        ...singleLineChartSpec.encoding.y,
        axis: {
          ...singleLineChartSpec.encoding.y.axis,
          title: $currentSensorEntry.yAxis ? $currentSensorEntry.yAxis : ' ',
        },
      },
    },
  };
</script>

<style>
  .root {
    list-style-type: none;
  }

  .single-sensor-chart {
    height: 4em;
  }

  .vega-wrapper {
    position: relative;
  }
  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }
</style>

<ul class="root">
  {#each smallMultipleLineCharts as sensor}
    <li>
      <h5 title={sensor.tooltipText} on:click={() => toggleSingleView(sensor.key)}>{sensor.name}</h5>
      <div class="single-sensor-chart vega-wrapper">
        <Vega data={sensor.data} spec={sensorSingleLineChartSpec} />
      </div>
    </li>
  {/each}
</ul>
