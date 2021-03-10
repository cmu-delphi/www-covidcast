<script>
  import IndicatorTable from './IndicatorTable.svelte';
  import CasesOverview from './CasesOverview.svelte';
  import HighlightIndicators from './HighlightIndicators.svelte';
  import AllIndicatorOverview from './AllIndicatorOverview.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../maps';
  import SurveyParameters from '../survey/SurveyParameters.svelte';
  import { currentRegionInfo, currentSensorEntry, currentDateObject, times } from '../../stores';
  import { SensorParam, DateParam, RegionParam, DataFetcher, CASES } from '../../stores/params';
  import './common.css';
  import RegionMapWrapper from './RegionMapWrapper.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import HistoryLineChart from './HistoryLineChart.svelte';

  $: sensor = new SensorParam($currentSensorEntry, $times);
  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);
  $: region = new RegionParam($currentRegionInfo);

  const items = [nationInfo, ...stateInfo, ...countyInfo];

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);
  }
</script>

<style>
  h3.header {
    font-size: 1.125rem;
    font-weight: 600;
    text-align: center;
    margin: 0.6em 0;
  }
  h4.header {
    margin: 0;
    margin-bottom: 1em;
    font-size: 0.875rem;
    text-align: center;
  }

  @media only screen and (min-width: 750px) {
    h3.header {
      font-size: 1.5rem;
    }
  }
</style>

<div class="mobile-root">
  <SurveyParameters sensor={sensor.value} {items} placeholder="Search by State or County">
    <div class="grid-3-11 mobile-header-line" slot="title">
      <h2>LOCATION <span>Summary</span></h2>
    </div>
  </SurveyParameters>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <CasesOverview {date} {region} {fetcher} />
      <hr />
      <h3 class="header">COVID-19 Cases by state</h3>
      <h4 class="header">{CASES.description}</h4>
    </div>
    <RegionMapWrapper {region} {date} sensor={CASES} {fetcher} />
    <div class="grid-3-11">
      <hr />
      <FancyHeader sub="Chart">Indicator</FancyHeader>
      <div class="chart-300">
        <HistoryLineChart sensor={CASES} {date} {region} {fetcher} />
      </div>
      <hr />
      <AllIndicatorOverview {date} {region} {fetcher} />
      <hr />
      <HighlightIndicators {date} {region} {fetcher} />
      <hr />
      <IndicatorTable {date} {region} {fetcher} />
    </div>
  </div>
</div>
