<script>
  import Vega from '../../components/vega/Vega.svelte';
  import sensorSingleLineChartSpec from './SmallMultipleChart.json';

  export let data;
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
