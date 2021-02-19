<script>
  import MobileWrapper from './MobileWrapper.svelte';
  import GeoTable from './GeoTable.svelte';
  import IndicatorOverview from './IndicatorOverview.svelte';
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { currentMode } from '../../stores';
  import { modeByID } from '..';

  function switchMode() {
    currentMode.set(modeByID.mobile);
  }
</script>

<style>
  .back {
    margin-top: 2rem;
    display: block;
    width: 100%;
  }
</style>

<MobileWrapper let:params let:sensor>
  <IndicatorOverview {sensor} {params} />
  <hr />
  <GeoTable {sensor} {params} />

  <button class="uk-button uk-button-default uk-button-delphi back" on:click={switchMode}>
    <span class="inline-svg-icon">
      {@html chevronLeftIcon}
    </span>
    Indicator Table
  </button>
</MobileWrapper>
