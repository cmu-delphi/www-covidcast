<script>
  import IndicatorTable from './IndicatorTable.svelte';
  import CasesOverview from './CasesOverview.svelte';
  import HighlightIndicators from './HighlightIndicators.svelte';
  import AllIndicatorOverview from './AllIndicatorOverview.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import RegionDatePicker from '../../components/RegionDatePicker.svelte';
  import {
    currentRegionInfo,
    currentSensorEntry,
    currentDateObject,
    getScrollToAnchor,
    metaDataManager,
    sensorList,
  } from '../../stores';
  import { SensorParam, DateParam, RegionParam, DataFetcher } from '../../stores/params';
  import RegionMapWrapper from '../../blocks/RegionMapWrapper.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import HistoryLineChart from '../../blocks/HistoryLineChart.svelte';
  import { afterUpdate } from 'svelte';
  import { scrollIntoView } from '../../util';
  import { modeByID } from '..';

  $: sensor = new SensorParam($currentSensorEntry, $metaDataManager);
  $: date = new DateParam($currentDateObject);
  $: region = new RegionParam($currentRegionInfo);

  $: CASES = new SensorParam(
    sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Cases')),
    $metaDataManager,
  );

  const items = [nationInfo, ...stateInfo, ...countyInfo];

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);
  }

  afterUpdate(() => {
    scrollIntoView(getScrollToAnchor(modeByID.summary));
  });
</script>

<div class="mobile-root">
  <RegionDatePicker sensor={sensor.value} {items} defaultItem={nationInfo} placeholder="Search by State or County">
    <div class="grid-3-11 mobile-header-line" slot="title">
      <h2>Explore a <span>Location</span></h2>
    </div>
  </RegionDatePicker>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <FancyHeader invert>{region.displayName}</FancyHeader>
      <CasesOverview {date} {region} {fetcher} />
      <hr />
      <h3 class="header">COVID-19 Cases by state</h3>
      <h4 class="header">{@html CASES.description}</h4>
      <RegionMapWrapper {region} {date} sensor={CASES} {fetcher} />
      <hr />
      <FancyHeader invert sub="Chart" anchor="chart">{CASES.name}</FancyHeader>
      <div class="chart-300">
        <HistoryLineChart sensor={CASES} {date} {region} {fetcher} expandableWindow />
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
