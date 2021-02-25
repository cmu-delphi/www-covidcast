<script>
  import { currentRegionInfo, currentSensorEntry, currentDateObject, times } from '../../stores';
  import MobileParameters from './MobileParameters.svelte';
  import { SensorParam, DateParam, RegionParam, DataFetcher } from '../../stores/params';
  import './common.css';

  $: sensor = new SensorParam($currentSensorEntry, $times);
  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);
  $: region = new RegionParam($currentRegionInfo);

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);
  }
</script>

<div class="mobile-root">
  <MobileParameters sensor={sensor.value} />
  <slot {sensor} {date} {region} {fetcher} />
</div>
