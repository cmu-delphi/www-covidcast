<script>
  import { currentRegionInfo, currentSensorEntry, currentDateObject } from '../../stores';
  import MobileParameters from './MobileParameters.svelte';
  import './common.css';
  import { asParams } from './utils';

  $: params = asParams($currentSensorEntry, $currentRegionInfo, $currentDateObject);
</script>

<div class="mobile-root">
  <MobileParameters sensor={params.sensor} />
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <slot {params} />
    </div>
  </div>
</div>
