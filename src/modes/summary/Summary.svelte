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
    sensorList,
    defaultCasesSensor,
    currentMode,
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

    // fetch all trends before hand for better performance
    // and avoid weird jhu-csse index bug
    fetcher.fetchNSensors1Region1DateTrend($sensorList, region, date);
  }

  afterUpdate(() => {
    scrollIntoView(getScrollToAnchor(modeByID.summary));
  });

  function switchMode() {
    currentMode.set(modeByID.indicator);
  }
</script>

<div class="mobile-root">
  <RegionDatePicker sensor={sensor.value} {items} defaultItem={nationInfo} placeholder="Search by State or County">
    <div class="grid-3-11 mobile-header-line" slot="title">
      <h2>
        Explore a <span>Location</span> (<a
          href="?mode=indicator"
          class="uk-link-muted"
          on:click|preventDefault={switchMode}>or <span>Indicator</span></a
        >)
      </h2>
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
        <HistoryLineChart sensor={CASES} {date} {region} {fetcher} />
      </div>
      <hr />
      <IndicatorTable {date} {region} {fetcher} />
    </div>
  </div>
</div>
