<script>
  import Search from './Search.svelte';
  import { formatAPITime, parseAPITime } from '../data';
  import { currentDate, currentRegionInfo, selectByInfo } from '../stores';
  import SensorDatePicker2 from './SensorDatePicker2.svelte';

  /**
   * @type {import('../stores/params').Sensor}
   */
  export let sensor;

  export let defaultItem = null;

  export let placeholder = 'Search Region';

  /**
   * @type {import('../stores/params').Region[]}
   */
  export let items;

  $: selectedDate = parseAPITime($currentDate);
  $: if (selectedDate !== undefined) {
    currentDate.set(formatAPITime(selectedDate));
  }
  /**
   * @type {import("../../stores/DataFetcher").DataFetcher | null}
   */
  export let fetcher = null;

  /**
   * @param {import('../stores/params').Region} d
   */
  function combineKeywords(d) {
    return `${d.id} ${d.displayName}`;
  }
</script>

<div class="parameter-container">
  <slot name="title" />
  <div class="uk-container content-grid parameters">
    <Search
      className="survey-search grid-3-8"
      modern
      {placeholder}
      {items}
      title="Region"
      icon="location"
      selectedItem={$currentRegionInfo || defaultItem}
      labelFieldName="displayName"
      keywordFunction={combineKeywords}
      maxItemsToShowInList={5}
      on:change={(e) => selectByInfo(e.detail && e.detail.level === 'nation' ? null : e.detail)}
    />
    <SensorDatePicker2 className="survey-date grid-8-11" bind:value={selectedDate} {sensor} {fetcher} />
  </div>
  <slot />
</div>

<style>
  .parameter-container {
    position: sticky;
    top: 0px;
    background: #fafafc;
    border-top: 1px solid #d3d4d8;
    border-bottom: 1px solid #d3d4d8;
    z-index: 120;
  }

  .parameters {
    margin-top: 6px;
    margin-bottom: 6px;
  }

  @media only screen and (max-width: 715px) {
    .parameters {
      padding-bottom: 0;
      display: flex;
    }
    .parameters > :global(.survey-search) {
      flex-grow: 4;
    }
    .parameters > :global(.survey-date) {
      flex-grow: 1;
    }
  }
</style>
