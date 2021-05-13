<script>
  import RegionSearch from '../../../components/RegionSearch.svelte';
  import { countyInfo, getInfoByName, hhsInfo, hrrInfo, msaInfo, nationInfo, stateInfo } from '../../../data/regions';

  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  export let value = '';

  let syncedValue = value || '';

  $: defaultRegion = {
    id: '',
    displayName: `Use Configured (${region.displayName})`,
  };
  $: allItems = [defaultRegion, nationInfo, ...stateInfo, ...msaInfo, ...countyInfo, ...hrrInfo, ...hhsInfo];
</script>

<div>
  <label for="widget-adder-r" class="uk-form-label">Geographic Region</label>
  <input type="hidden" value={syncedValue} name="region" />
  <RegionSearch
    items={allItems}
    selectedItem={value ? getInfoByName(value) : defaultRegion}
    on:change={(e) => region.set(e.detail && e.detail.level === 'nation' ? null : e.detail)}
  />
</div>
