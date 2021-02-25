<script>
  import { currentRegionInfo, currentSensorEntry, currentDateObject } from '../../stores';
  import MobileParameters from './MobileParameters.svelte';
  import { SensorParam, DateParam, RegionParam } from '../../stores/params';
  import './common.css';

  $: sensor = new SensorParam($currentSensorEntry);
  $: date = new DateParam($currentDateObject);
  $: region = new RegionParam($currentRegionInfo);
</script>

<div class="mobile-root">
  <MobileParameters sensor={sensor.value} />
  <slot {sensor} {date} {region} />
</div>
