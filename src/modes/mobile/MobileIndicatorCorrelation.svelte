<script>
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { modeByID } from '..';
  import { countyInfo, nationInfo, stateInfo } from '../../maps';
  import {
    currentDateObject,
    currentMode,
    currentRegionInfo,
    currentSensor2,
    currentSensorEntry,
    currentSensorEntry2,
    times,
  } from '../../stores';
  import { DataFetcher, DateParam, RegionParam, SensorParam } from '../../stores/params';
  import SurveyParameters from '../survey/SurveyParameters.svelte';
  import './common.css';
  import IndicatorDropdown from './IndicatorDropdown.svelte';

  $: sensor = new SensorParam($currentSensorEntry);
  $: sensor2 = new SensorParam($currentSensorEntry2, currentSensor2);
  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);
  $: region = new RegionParam($currentRegionInfo);

  const items = [nationInfo, ...stateInfo, ...countyInfo];

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);
  }

  function switchMode() {
    currentMode.set(modeByID.indicator);
  }
</script>

<div class="mobile-root">
  <SurveyParameters sensor={sensor.value} {items} defaultItem={nationInfo} placeholder="Search by State or County">
    <div class="grid-3-11 mobile-header-line" slot="title">
      <button class="mobile-back inline-svg-icon" on:click={switchMode}>
        {@html chevronLeftIcon}
      </button>
      <h2>Explore an <span>Indicator</span></h2>
    </div>
    <IndicatorDropdown {sensor} />
    <IndicatorDropdown sensor={sensor2} />
  </SurveyParameters>
  <div class="uk-container content-grid">
    <div class="grid-3-11">TODO</div>
  </div>
</div>
