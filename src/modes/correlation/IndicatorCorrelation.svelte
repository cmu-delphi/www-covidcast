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
  import '../mobile/common.css';
  import IndicatorDropdown from '../mobile/IndicatorDropdown.svelte';
  import IndicatorCorrelationChart from './IndicatorCorrelationChart.svelte';
  import LagChart from './LagChart.svelte';
  import HistoryLineChart from '../mobile/HistoryLineChart.svelte';

  $: primary = new SensorParam($currentSensorEntry);
  $: secondary = new SensorParam($currentSensorEntry2, currentSensor2);
  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);
  $: region = new RegionParam($currentRegionInfo);

  const items = [nationInfo, ...stateInfo, ...countyInfo];

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(primary, region, date);
  }

  function switchMode() {
    currentMode.set(modeByID.indicator);
  }

  let sensorDetailsLag = 0;
</script>

<div class="mobile-root">
  <SurveyParameters sensor={primary.value} {items} defaultItem={nationInfo} placeholder="Search by State or County">
    <div class="grid-3-11 mobile-header-line" slot="title">
      <button class="mobile-back inline-svg-icon" on:click={switchMode}>
        {@html chevronLeftIcon}
      </button>
      <h2>Explore <span>Correlations</span></h2>
    </div>
    <IndicatorDropdown sensor={primary} />
    <IndicatorDropdown sensor={secondary} />
  </SurveyParameters>

  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <IndicatorCorrelationChart {primary} {secondary} {date} {region} {fetcher} lag={sensorDetailsLag} />

      <input
        type="range"
        min={-28}
        max={28}
        step={1}
        bind:value={sensorDetailsLag}
        style="width:450px;  margin-left: 35px"
      />

      <LagChart {primary} {secondary} {date} {region} {fetcher} />

      <HistoryLineChart sensor={primary} {date} {region} {fetcher} />
      <HistoryLineChart sensor={secondary} {date} {region} {fetcher} />
    </div>
  </div>
</div>
