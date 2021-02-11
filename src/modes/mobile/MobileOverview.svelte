<script>
  import { nameInfos, nationInfo } from '../../maps';
  import { currentRegionInfo, currentRegion, currentSensorEntry, currentDateObject } from '../../stores';
  import SurveyParameters from '../survey/SurveyParameters.svelte';
  import IndicatorTable from './IndicatorTable.svelte';
  import Overview from './Overview.svelte';
  import { toTimeValue } from './utils';
  import './common.css';

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
  .details {
    margin-top: 1em;
  }
  .content-grid {
    grid-row-gap: 0;
  }
</style>

<div class="root">
  <SurveyParameters sensor={$currentSensorEntry} items={nameInfos} defaultItem={nationInfo} />
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <Overview {params} />
    </div>
    <div class="grid-3-11 details">
      <IndicatorTable {params} />
    </div>
  </div>
</div>
