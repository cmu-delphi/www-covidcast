<script>
  import { currentRegionInfo, currentSensorEntry, currentDateObject } from '../../stores';
  import MobileParameters from './MobileParameters.svelte';
  import { createSensorParam, createDateParam, createRegionParam } from '../../stores/params';
  import './common.css';

  $: sensor = createSensorParam($currentSensorEntry);
  $: date = createDateParam($currentDateObject);
  $: region = createRegionParam($currentRegionInfo);
</script>

<div class="mobile-root">
  <MobileParameters sensor={sensor.value} />
  <slot {sensor} {date} {region} />
</div>
