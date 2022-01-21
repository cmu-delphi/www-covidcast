<script>
  import FancyHeader from '../../components/FancyHeader.svelte';
  import RegionMapWrapper from '../../blocks/RegionMapWrapper.svelte';
  import HistoryLineChart from '../../blocks/HistoryLineChart.svelte';
  import IndicatorDropdown from '../../components/IndicatorPicker.svelte';
  import GeoTable from './GeoTable.svelte';
  import IndicatorOverview from '../../blocks/IndicatorOverview.svelte';
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { currentMode, getScrollToAnchor, metaDataManager } from '../../stores';
  import { modeByID } from '..';
  import IndicatorAbout from './IndicatorAbout.svelte';
  import RegionOverview from './RegionOverview.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import RegionDatePicker from '../../components/RegionDatePicker.svelte';
  import { currentRegionInfo, currentSensorEntry, currentDateObject } from '../../stores';
  import { SensorParam, DateParam, RegionParam } from '../../stores/params';
  import { formatDateDayOfWeek } from '../../formats';
  import { afterUpdate } from 'svelte';
  import { scrollIntoView } from '../../util';
  import IndicatorWarning from '../../blocks/IndicatorWarning.svelte';
  import IndicatorAnnotations from '../../components/IndicatorAnnotations.svelte';
  import MaxDateHint from '../../blocks/MaxDateHint.svelte';
  import { DataFetcher } from '../../stores/DataFetcher';

  $: sensor = new SensorParam($currentSensorEntry, $metaDataManager);
  $: date = new DateParam($currentDateObject);
  $: region = new RegionParam($currentRegionInfo);

  const stateItems = [nationInfo, ...stateInfo];
  const countyItems = [...stateItems, ...countyInfo];
  $: items = sensor.value.levels.includes('county') ? countyItems : stateItems;

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);
  }

  $: {
    document.title = `COVIDcast | ${sensor.name} Indicator Details`;
  }

  function switchMode() {
    currentMode.set(modeByID.summary);
  }
  afterUpdate(() => {
    scrollIntoView(getScrollToAnchor(modeByID.summary));
  });
</script>

<div class="mobile-root">
  <RegionDatePicker
    sensor={sensor.value}
    {items}
    defaultItem={nationInfo}
    placeholder="Search by State or County"
    {fetcher}
  >
    <div class="grid-3-11 mobile-header-line mobile-back-line" slot="title">
      <h2>
        <button class="mobile-back inline-svg-icon" on:click|preventDefault={switchMode} title="Back">
          {@html chevronLeftIcon}
        </button>
        Explore an <span>Indicator</span> (<a
          class="uk-link-muted"
          href="?mode=summary"
          on:click|preventDefault={switchMode}>or <span>Location</span></a
        >)
      </h2>
    </div>
    <div class="uk-container content-grid uk-margin-remove-vertical">
      <IndicatorDropdown {sensor} />
    </div>
  </RegionDatePicker>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <IndicatorAnnotations {date} {region} {sensor} range="sparkLine" />
      <FancyHeader invert sub="Summary">{sensor.name}</FancyHeader>
      <IndicatorWarning {sensor} {date} {region} {fetcher} />

      <p>
        On {formatDateDayOfWeek(date.value)}
        <MaxDateHint sensor={sensor.value} suffix="," {fetcher} />
        the {sensor.valueUnit} was:
      </p>
      <IndicatorOverview {sensor} {date} {region} {fetcher} />
      <RegionOverview {region} />
      <hr />
      {#if !sensor.value.noMaps}
        <FancyHeader invert sub="Map" anchor="map">{sensor.name}</FancyHeader>
        <RegionMapWrapper {sensor} {date} {region} {fetcher} />
        <hr />
      {/if}
      <FancyHeader invert sub="Chart" anchor="chart">{sensor.name}</FancyHeader>
      <div class="chart-300">
        <HistoryLineChart {sensor} {date} {region} {fetcher} />
      </div>
    </div>
    <IndicatorAbout {sensor} />
    <div class="grid-3-11">
      <hr />
      <GeoTable {sensor} {region} {date} {fetcher} />
      <hr />
    </div>
  </div>
</div>
