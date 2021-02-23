<script>
  import MobileWrapper from './MobileWrapper.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import RegionMap from './RegionMap.svelte';
  import HistoryLineChart from './HistoryLineChart.svelte';
  import IndicatorDropdown from './IndicatorDropdown.svelte';
  import GeoTable from './GeoTable.svelte';
  import IndicatorOverview from './IndicatorOverview.svelte';
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { currentMode } from '../../stores';
  import { modeByID } from '..';

  function switchMode() {
    currentMode.set(modeByID.overview);
  }
</script>

<style>
  .back {
    margin-top: 2rem;
    display: block;
    width: 100%;
  }
</style>

<MobileWrapper let:sensor let:region let:date>
  <FancyHeader sub="Details">INDICATOR</FancyHeader>

  <IndicatorDropdown {sensor} />

  <hr />

  <div class="chart-250">
    <RegionMap {sensor} {date} {region} />
  </div>

  <FancyHeader>Performance</FancyHeader>

  <div class="chart-150">
    <HistoryLineChart {sensor} {date} {region} />
  </div>

  <hr />
  <IndicatorOverview {sensor} {date} {region} />
  <hr />
  <GeoTable {sensor} {region} {date} />

  <button class="uk-button uk-button-default uk-button-delphi back" on:click={switchMode}>
    <span class="inline-svg-icon">
      {@html chevronLeftIcon}
    </span>
    Indicator Table
  </button>
</MobileWrapper>
