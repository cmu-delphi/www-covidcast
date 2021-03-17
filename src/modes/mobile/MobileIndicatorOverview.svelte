<script>
  import FancyHeader from './FancyHeader.svelte';
  import RegionMapWrapper from './RegionMapWrapper.svelte';
  import HistoryLineChart from './HistoryLineChart.svelte';
  import IndicatorDropdown from './IndicatorDropdown.svelte';
  import GeoTable from './GeoTable.svelte';
  import IndicatorOverview from './IndicatorOverview.svelte';
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { currentMode } from '../../stores';
  import { modeByID } from '..';
  import IndicatorAbout from './IndicatorAbout.svelte';
  import RegionOverview from './RegionOverview.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../maps';
  import SurveyParameters from '../survey/SurveyParameters.svelte';
  import { currentRegionInfo, currentSensorEntry, currentDateObject, times } from '../../stores';
  import { SensorParam, DateParam, RegionParam, DataFetcher } from '../../stores/params';
  import './common.css';
  import { formatDateWeekday } from '../../formats';

  $: sensor = new SensorParam($currentSensorEntry, $times);
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
  </SurveyParameters>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <p>On {formatDateWeekday(date.value)}, the {sensor.valueUnit} was:</p>
      <IndicatorOverview {sensor} {date} {region} {fetcher} />
      <RegionOverview {region} />

      <FancyHeader invert sub="Map">{sensor.name}</FancyHeader>
      <RegionMapWrapper {sensor} {date} {region} {fetcher} />
      <FancyHeader invert sub="Chart">{sensor.name}</FancyHeader>

      <div class="chart-300">
        <HistoryLineChart {sensor} {date} {region} {fetcher} />
      </div>
    </div>
  </div>
  <IndicatorAbout {sensor} />
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <GeoTable {sensor} {region} {date} {fetcher} />
    </div>
  </div>
</div>
