<script>
  import { currentRegion, currentLevel } from '../../stores';
  import { parseAPITime } from '../../data/utils';
  import { fetchCustomTimeSlice } from '../../data/fetchData';
  import Vega from '../../components/vega/Vega.svelte';
  import sensorSingleLineChartSpec from '../../components/vega/SmallMultipleLineChart.json';

  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  export let sensor;
  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200601');
  const finalDay = new Date();

  $: data = fetchCustomTimeSlice(sensor, $currentLevel, $currentRegion, startDay, finalDay);
</script>

<style>
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

<div class="single-sensor-chart vega-wrapper">
  <Vega {data} spec={sensorSingleLineChartSpec} />
</div>
