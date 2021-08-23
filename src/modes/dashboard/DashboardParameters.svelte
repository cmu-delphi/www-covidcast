<script>
  import RegionSearch from '../../components/RegionSearch.svelte';
  import SensorDatePicker2 from '../../components/SensorDatePicker2.svelte';
  import SensorSearch from '../../components/SensorSearch.svelte';
  import { formatAPITime } from '../../data';
  import { metaDataManager } from '../../stores';
  import { trackEvent } from '../../stores/ga';
  import { sortedNameInfos } from './utils';

  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;

  let selectedDate = date.value;

  function updateDate(value) {
    selectedDate = value;
  }
  $: {
    updateDate(date.value);
  }
  $: if (selectedDate !== undefined) {
    setDate(selectedDate);
  }

  function setDate(d) {
    trackEvent('dashboard', 'set_date', 'global', formatAPITime(d));
    date.set(d);
  }
  function setRegion(d) {
    trackEvent('dashboard', 'set_region', 'global', !d ? 'us' : d.propertyId);
    region.set(d);
  }
  function setSensor(d) {
    trackEvent('dashboard', 'set_sensor', 'global', d.key);
    sensor.set(d);
  }

  $: filteredNameInfos = sortedNameInfos.filter((d) => sensor.supportsRegion(d));
</script>

<div class="uk-container content-grid">
  <SensorSearch
    className="grid-1-5"
    modern
    items={$metaDataManager.metaSensors}
    selectedItem={sensor.value}
    on:change={(e) => setSensor(e.detail)}
  />
  <RegionSearch
    className="grid-5-9"
    modern
    items={filteredNameInfos}
    selectedItem={region.value}
    on:change={(e) => setRegion(e.detail && e.detail.level === 'nation' ? null : e.detail)}
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
