<script>
  import IndicatorTable from './IndicatorTable.svelte';
  import CasesOverview from './CasesOverview.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import RegionDatePicker from '../../components/RegionDatePicker.svelte';
  import {
    currentRegionInfo,
    currentSensorEntry,
    currentDateObject,
    getScrollToAnchor,
    metaDataManager,
    defaultCasesSensor,
  } from '../../stores';
  import { SensorParam, DateParam, RegionParam } from '../../stores/params';
  import RegionMapWrapper from '../../blocks/RegionMapWrapper.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import HistoryLineChart from '../../blocks/HistoryLineChart.svelte';
  import { afterUpdate } from 'svelte';
  import { scrollIntoView } from '../../util';
  import { modeByID } from '..';
  import { DataFetcher } from '../../stores/DataFetcher';

  $: sensor = new SensorParam($currentSensorEntry, $metaDataManager);
  $: date = new DateParam($currentDateObject);
  $: region = new RegionParam($currentRegionInfo);

  $: CASES = new SensorParam($defaultCasesSensor, $metaDataManager);

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
      <FancyHeader invert sub="Map" anchor="map">{CASES.name}</FancyHeader>
      <p>{@html CASES.signalTooltip}</p>
      <RegionMapWrapper {region} {date} sensor={CASES} {fetcher} />
      <hr />
      <FancyHeader invert sub="Chart" anchor="chart">{CASES.name}</FancyHeader>
      <div class="chart-300">
        <HistoryLineChart sensor={CASES} {date} {region} {fetcher} expandableWindow />
      </div>
      <hr />
      <IndicatorTable {date} {region} {fetcher} />
    </div>
  </div>
</div>
