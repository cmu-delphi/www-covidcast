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
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <slot {sensor} {date} {region} />
    </div>
  </div>
</div>
