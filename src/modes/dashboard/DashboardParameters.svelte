<script>
  import IndicatorPicker from '../../components/IndicatorPicker.svelte';
  import Search from '../../components/Search.svelte';
  import SensorDatePicker2 from '../../components/SensorDatePicker2.svelte';
  import { nameInfos } from '../../data/regions';
  import { allSensorsGrouped } from '../../stores/allSensors';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  /**
   * @param {import('../stores/params').Region} d
   */
  function combineKeywords(d) {
    return `${d.id} ${d.displayName}`;
  }

  let selectedDate = date.value;

  function updateDate(value) {
    selectedDate = value;
  }
  $: {
    updateDate(date.value);
  }
  $: if (selectedDate !== undefined) {
    date.set(selectedDate);
  }
</script>

<div class="uk-container content-grid">
  <IndicatorPicker {sensor} className="grid-1-5" allSensors={allSensorsGrouped} />
  <Search
    className="grid-5-9"
    modern
    placeholder="Select Region"
    items={nameInfos}
    title="Region"
    icon="location"
    selectedItem={region.value}
    labelFieldName="displayName"
    keywordFunction={combineKeywords}
    maxItemsToShowInList="5"
    on:change={(e) => region.set(e.detail && e.detail.level === 'nation' ? null : e.detail)}
  />
  <SensorDatePicker2 className="grid-9-13" bind:value={selectedDate} {sensor} />
</div>

<style>
  .content-grid {
    margin-top: 6px;
    margin-bottom: 0;
    z-index: 1000;
  }

  .content-grid :global(.search-box) {
    margin-bottom: 6px;
    margin-top: 0.5rem;
  }

  .content-grid :global(.grid-1-5 .trigger) {
    font-weight: 400;
  }
</style>
