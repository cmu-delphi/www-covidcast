<script>
  import FancyHeader from '../../components/FancyHeader.svelte';
  import RegionMapWrapper from '../../blocks/RegionMapWrapper.svelte';
  import HistoryLineChart from '../../blocks/HistoryLineChart.svelte';
  import IndicatorDropdown from '../../components/IndicatorPicker.svelte';
  import GeoTable from './GeoTable.svelte';
  import IndicatorOverview from '../../blocks/IndicatorOverview.svelte';
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { currentMode, getScrollToAnchor } from '../../stores';
  import { modeByID } from '..';
  import IndicatorAbout from './IndicatorAbout.svelte';
  import RegionOverview from './RegionOverview.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import RegionDatePicker from '../../components/RegionDatePicker.svelte';
  import { currentRegionInfo, currentSensorEntry, currentDateObject, times } from '../../stores';
  import { SensorParam, DateParam, RegionParam, DataFetcher } from '../../stores/params';
  import { formatDateWeekday } from '../../formats';
  import { afterUpdate } from 'svelte';
  import { scrollIntoView } from '../../util';
  import IndicatorAnnotations from '../../components/IndicatorAnnotations.svelte';
  import IndicatorCorrelation from './IndicatorCorrelation.svelte';
  import MaxDateHint from '../../blocks/MaxDateHint.svelte';

  $: sensor = new SensorParam($currentSensorEntry);
  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);
  $: region = new RegionParam($currentRegionInfo);

  const items = [nationInfo, ...stateInfo, ...countyInfo];

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
  <RegionDatePicker sensor={sensor.value} {items} defaultItem={nationInfo} placeholder="Search by State or County">
    <div class="grid-3-11 mobile-header-line" slot="title">
      <button class="mobile-back inline-svg-icon" on:click={switchMode}>
        {@html chevronLeftIcon}
      </button>
      <h2>Explore an <span>Indicator</span></h2>
    </div>
    <div class="uk-container content-grid uk-margin-remove-vertical">
      <IndicatorDropdown {sensor} />
    </div>
  </RegionDatePicker>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <IndicatorAnnotations {date} {region} {sensor} range="sparkLine" />
      <FancyHeader invert sub="Summary">{sensor.name}</FancyHeader>
      <p>
        On {formatDateWeekday(date.value)}
        <MaxDateHint sensor={sensor.value} level={region.level} suffix="," />
        the {sensor.valueUnit} was:
      </p>
      <IndicatorOverview {sensor} {date} {region} {fetcher} />
      <RegionOverview {region} />
      <hr />
      <FancyHeader invert sub="Map" anchor="map">{sensor.name}</FancyHeader>
      <RegionMapWrapper {sensor} {date} {region} {fetcher} />
      <hr />
      <FancyHeader invert sub="Chart" anchor="chart">{sensor.name}</FancyHeader>
      <div class="chart-300">
        <HistoryLineChart {sensor} {date} {region} {fetcher} expandableWindow />
      </div>
    </div>
    <IndicatorAbout {sensor} />
    <div class="grid-3-11">
      <hr />
      <GeoTable {sensor} {region} {date} {fetcher} />
      <hr />
    </div>
    <IndicatorCorrelation {sensor} {region} {date} {fetcher} />
  </div>
</div>
