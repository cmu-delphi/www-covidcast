<script>
  import Search from '../../components/Search.svelte';
  import { nameInfos } from '../../maps';
  import { currentDateObject, currentRegionInfo, selectByInfo } from '../../stores';
  import { sensorList } from '../../stores/constants';
  import SensorCard from './SensorCard.svelte';
  import throttle from 'lodash-es/throttle';

  let highlightTimeValue = null;

  const throttled = throttle((value) => {
    highlightTimeValue = value;
  }, 10);

  function onHighlight(e) {
    const highlighted = e.detail.value;
    const id = highlighted && Array.isArray(highlighted._vgsid_) ? highlighted._vgsid_[0] : null;

    if (!id) {
      throttled(null);
      return;
    }
    const row = e.detail.view.data('data_0').find((d) => d._vgsid_ === id);
    throttled(row ? row.time_value : null);
  }
</script>

<style>
  .root {
    flex: 1 1 0;
    margin: 0.5em;
    display: flex;
    flex-direction: column;
  }

  .root :global(.search-container) {
    align-self: center;
    width: 30em;
  }

  /** mobile **/
  @media only screen and (max-width: 40em) {
    .root :global(.search-container) {
      align-self: stretch;
      width: unset;
    }
  }

  .grid-wrapper {
    flex: 1 1 0;
    overflow: auto;
    position: relative;
  }

  .grid {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    display: flex;
    flex-wrap: wrap;
  }
</style>

<div class="root base-font-size">
  <Search
    className="search-container container-bg container-style"
    placeholder="Search for a location..."
    items={nameInfos}
    selectedItem={$currentRegionInfo}
    labelFieldName="displayName"
    maxItemsToShowInList="5"
    on:change={(e) => selectByInfo(e.detail)} />

  <div class="grid-wrapper">
    <div class="grid">
      {#each sensorList as sensor}
        <SensorCard {sensor} date={$currentDateObject} region={$currentRegionInfo} {onHighlight} {highlightTimeValue} />
      {/each}
    </div>
  </div>
</div>
