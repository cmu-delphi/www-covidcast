<script>
  import { setContext } from 'svelte';
  import { isMobileDevice } from '../../stores';
  import { currentRegionInfo, currentSensorEntry, currentDateObject, times } from '../../stores';
  import { SensorParam, DateParam, RegionParam, DataFetcher } from '../../stores/params';
  import KPIWidget from './widgets/KPIWidget.svelte';
  import './style.css';
  import { WidgetHighlight } from './highlight';
  import LineChartWidget from './widgets/LineChartWidget.svelte';

  $: sensor = new SensorParam($currentSensorEntry);
  $: region = new RegionParam($currentRegionInfo);
  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);
  }

  setContext('fetcher', fetcher);

  /**
   * @type {import('./highlight').WidgetHighlight | null}
   */
  let highlight = null;

  function initHighlight(sensor, region, date) {
    highlight = new WidgetHighlight(sensor.value, region.value, date.value);
  }
  $: {
    initHighlight(sensor, region, date);
  }
</script>

<div class="root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>COVIDcast <span>Dashboard</span></h2>
    </div>
  </div>
  <div class="panel-wrapper">
    <div class="panel">
      {#if $isMobileDevice}
        <div class="uk-alert uk-alert-warning">This view is optimized for larger screens only</div>
      {/if}
      <KPIWidget {sensor} {date} {region} bind:highlight />
      <LineChartWidget {sensor} {date} {region} bind:highlight />
    </div>
  </div>
</div>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    font-size: 0.875rem;
    line-height: 1.5rem;
    display: flex;
    flex-direction: column;
  }

  .panel-wrapper {
    flex: 1 1 0;
    position: relative;
  }
  .panel {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(4, 1fr);
    grid-auto-flow: dense;
    gap: 0.5em;
  }
</style>
