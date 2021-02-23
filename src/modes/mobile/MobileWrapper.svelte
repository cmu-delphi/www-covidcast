<script>
  import { currentRegionInfo, currentSensorEntry, currentDateObject } from '../../stores';
  import MobileParameters from './MobileParameters.svelte';
  import { asSensorParam, asDateParam, asRegionParam } from '../../stores/params';
  import './common.css';

  $: sensor = asSensorParam($currentSensorEntry);
  $: date = asDateParam($currentDateObject);
  $: region = asRegionParam($currentRegionInfo);
</script>

<div class="mobile-root">
  <MobileParameters sensor={sensor.value} />
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <slot {sensor} {date} {region} />
    </div>
  </div>
</div>
