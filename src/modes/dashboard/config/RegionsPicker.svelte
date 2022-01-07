<script>
  import RegionSearch from '../../../components/RegionSearch.svelte';
  import { getInfoByName } from '../../../data/regions';
  import { sortedNameInfos } from '../utils';

  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  /**
   * @type {string[]}
   */
  export let value = [];

  let syncedValues = value ? (Array.isArray(value) ? value : [value]) : [''];

  $: defaultRegion = {
    id: '',
    displayName: `Use Configured: ${region.displayName}`,
  };
  $: allItems = [defaultRegion, ...sortedNameInfos];

  $: selectedItems = syncedValues.map((d) => (!d ? defaultRegion : getInfoByName(d)));
</script>

<div class="regions-picker">
  <label for="widget-adder-r" class="uk-form-label">Geographic Regions</label>
  {#each syncedValues as s}
    <input type="hidden" value={s} name="regions" />
  {/each}
  <RegionSearch
    items={allItems}
    {selectedItems}
    on:change={(e) => {
      syncedValues = e.detail ? [`${e.detail.id}@${e.detail.level}`] : [''];
    }}
    on:add={(e) => {
      if (syncedValues.length === 1 && syncedValues[0] === '') {
        // replace default
        syncedValues = [`${e.detail.id}@${e.detail.level}`];
      } else {
        syncedValues = [...syncedValues, `${e.detail.id}@${e.detail.level}`];
      }
    }}
  />
</div>

<style>
  .regions-picker :global(.search-multiple) {
    max-width: 35em;
  }
</style>
