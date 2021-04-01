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
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import { MULTI_COLORS } from '../../specs/lineSpec';

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
      <div class="chart-correlation">
        <IndicatorCorrelationChart {primary} {secondary} {date} {region} {fetcher} lag={sensorDetailsLag} />
      </div>

      <input type="range" min={-28} max={28} step={1} bind:value={sensorDetailsLag} class="range-selector" />

      <LagChart {primary} {secondary} {date} {region} {fetcher} />

      <FancyHeader invert sub="Chart">{primary.name}</FancyHeader>
      <div class="chart-300">
        <HistoryLineChart sensor={primary} {date} {region} {fetcher} singleRegionOnly />
      </div>
      <FancyHeader invert sub="Chart">{secondary.name}</FancyHeader>
      <div class="chart-300">
        <!-- TODO lag based date highlight -->
        <HistoryLineChart sensor={secondary} {date} {region} {fetcher} singleRegionOnly color={MULTI_COLORS[1]} />
      </div>
    </div>
  </div>
</div>

<style>
  .range-selector {
    display: block;
    margin: 1em 0;
    width: 100%;
  }

  .chart-correlation {
    position: relative;
    /** 1:1 + padding for legend **/
    padding-top: calc(100% + 50px);
  }

  .chart-correlation > :global(.vega-embed) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
