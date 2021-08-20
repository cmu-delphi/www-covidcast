<script>
  import RegionSearch from '../../../components/RegionSearch.svelte';
  import { getInfoByName } from '../../../data/regions';
  import { sortedNameInfos } from '../utils';

  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  export let value = '';

  let syncedValue = value || '';

  $: defaultRegion = {
    id: '',
    displayName: `Use Configured: ${region.displayName}`,
  };
  $: allItems = [defaultRegion, ...sortedNameInfos];
</script>

<div>
  <label for="widget-adder-r" class="uk-form-label">Geographic Region</label>
  <input type="hidden" value={syncedValue} name="region" />
  <RegionSearch
    items={allItems}
    selectedItem={value ? getInfoByName(value) : defaultRegion}
    on:change={(e) => {
      if (e.detail && e.detail.id) {
        syncedValue = `${e.detail.id}@${e.detail.level}`;
      } else {
        syncedValue = '';
      }
    }}
  />
</div>
