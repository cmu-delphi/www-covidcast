<script>
  import { nationInfo } from '../../maps';
  import { currentRegionInfo, currentRegion, currentSensorEntry, currentDateObject } from '../../stores';
  import MobileParameters from './MobileParameters.svelte';
  import { toTimeValue } from './utils';
  import './common.css';

  $: sensor = $currentSensorEntry;
  $: params = {
    region: $currentRegionInfo || nationInfo,
    date: $currentDateObject,
    timeValue: toTimeValue($currentDateObject),
    setRegion: (region) => {
      currentRegion.set(region.propertyId);
    },
  };
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    overflow: auto;
  }
</style>

<div class="root">
  <MobileParameters {sensor} />
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <slot {params} {sensor} />
    </div>
  </div>
</div>
