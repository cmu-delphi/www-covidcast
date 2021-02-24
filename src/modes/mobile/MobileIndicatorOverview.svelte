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
  import IndicatorAbout from './IndicatorAbout.svelte';
  import RegionOverview from './RegionOverview.svelte';

  function switchMode() {
    currentMode.set(modeByID.overview);
  }
</script>

<style>
  .header-line {
    text-align: center;
    position: relative;
  }
  .header-line h2 {
    line-height: 1;
    padding: 18px 0.5em 15px 0.5em;
    margin: 0;
    font-weight: 300;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .header-line h2 span {
    font-weight: 600;
  }

  .back {
    position: absolute;
    left: 1em;
    top: 0;
    height: 100%;
    width: 0.7em;
    display: flex;
    align-items: center;
    border: none;
    background: none;
    margin: 0;
    padding: 0;
    color: #56ccf2;
  }
</style>

<MobileWrapper let:sensor let:region let:date>
  <div class="uk-container content-grid mobile-invert-header">
    <div class="grid-3-11 header-line">
      <button class="back inline-svg-icon" on:click={switchMode}>
        {@html chevronLeftIcon}
      </button>
      <h2>Indicator <span>Details</span></h2>
    </div>
  </div>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <IndicatorDropdown {sensor} />
      <IndicatorOverview {sensor} {date} {region} />
      <RegionOverview {region} />

      <FancyHeader sub="Map">Indicator</FancyHeader>
      <div class="chart-250">
        <RegionMap {sensor} {date} {region} />
      </div>

      <FancyHeader>Performance</FancyHeader>

      <div class="chart-150">
        <HistoryLineChart {sensor} {date} {region} />
      </div>
    </div>
  </div>
  <IndicatorAbout {sensor} />
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <GeoTable {sensor} {region} {date} />
    </div>
  </div>
</MobileWrapper>
