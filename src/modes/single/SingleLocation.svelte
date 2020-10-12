<script>
  import Search from '../../components/Search.svelte';
  import { nameInfos } from '../../maps';
  import {
    addCompare,
    currentDateObject,
    currentRegionInfo,
    currentMultiSelection,
    removeCompare,
    selectByInfo,
  } from '../../stores';
  import { sensorList } from '../../stores/constants';
  import SensorCard from './SensorCard.svelte';
  import throttle from 'lodash-es/throttle';
  import { selectionColors } from '../../theme';
  import { resolveHighlightedTimeValue } from '../overview/vegaSpec';

  let highlightTimeValue = null;

  const throttled = throttle((value) => {
    highlightTimeValue = value;
  }, 50);

  function onHighlight(e) {
    const value = resolveHighlightedTimeValue(e);
    if (highlightTimeValue !== value) {
      throttled(value);
    }
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
    width: 60em;
  }
  .grid-wrapper {
    flex: 1 1 0;
    overflow: auto;
    position: relative;
  }

  .card-grid {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  .card-grid > :global(*) {
    width: 30em;
  }

  /** mobile **/
  @media only screen and (max-width: 60em) {
    .card-grid > :global(*) {
      width: 50em;
    }
    .root :global(.search-container) {
      align-self: stretch;
      width: unset;
    }
  }

  /** mobile **/
  @media only screen and (max-width: 40em) {
    .card-grid {
      display: block;
    }
    .card-grid > :global(*) {
      width: unset;
    }
  }
</style>

<div class="root base-font-size">
  <Search
    className="search-container container-bg container-style"
    placeholder={$currentRegionInfo ? 'Compare with...' : 'Search for a location...'}
    items={nameInfos}
    selectedItems={$currentMultiSelection}
    labelFieldName="displayName"
    maxItemsToShowInList="5"
    colorFieldName="color"
    maxSelections={Math.min(selectionColors.length + 1, 4)}
    on:add={(e) => addCompare(e.detail)}
    on:remove={(e) => removeCompare(e.detail.info)}
    on:change={(e) => selectByInfo(e.detail)} />

  <div class="grid-wrapper">
    <div class="card-grid">
      {#each sensorList as sensor}
        <SensorCard
          {sensor}
          date={$currentDateObject}
          selections={$currentMultiSelection}
          {onHighlight}
          {highlightTimeValue} />
      {/each}
    </div>
  </div>
</div>
