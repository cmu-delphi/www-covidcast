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
    currentLag,
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

  /**
   * @param {TimeFrame} timeFrame
   * @param {number} lag
   */
  function computeDomains(timeFrame, lag) {
    if (lag > 0) {
      return {
        primary: timeFrame.shift(-lag, 0).domain,
        secondary: timeFrame.shift(0, lag).domain,
      };
    }
    return {
      primary: timeFrame.shift(0, -lag).domain,
      secondary: timeFrame.shift(lag, 0).domain,
    };
  }

  $: domains = computeDomains(date.windowTimeFrame, $currentLag);
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
      <FancyHeader invert sub="Chart">R<sup>2</sup></FancyHeader>
      <LagChart {primary} {secondary} {date} {region} {fetcher} />
      <input type="range" min={-28} max={28} step={1} bind:value={$currentLag} class="range-selector" />

      <FancyHeader invert sub="Chart at Lag {$currentLag} days">Correlation</FancyHeader>
      <IndicatorCorrelationChart {primary} {secondary} {date} {region} {fetcher} lag={$currentLag} />

      <FancyHeader invert sub="Chart">{primary.name}</FancyHeader>
      <div class="chart-300">
        <HistoryLineChart sensor={primary} {date} {region} {fetcher} singleRegionOnly domain={domains.primary} />
      </div>
      <FancyHeader invert sub="Chart">{secondary.name}</FancyHeader>
      <div class="chart-300">
        <!-- TODO lag based date highlight -->
        <HistoryLineChart
          sensor={secondary}
          {date}
          {region}
          {fetcher}
          singleRegionOnly
          color={MULTI_COLORS[1]}
          domain={domains.secondary}
        />
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
</style>
