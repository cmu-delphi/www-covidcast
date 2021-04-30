<script>
  import Search from '../../../components/Search.svelte';
  import { countyInfo, getInfoByName, hhsInfo, hrrInfo, msaInfo, nationInfo, stateInfo } from '../../../data/regions';

  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  export let value = '';
  /**
   * @param {import('../stores/params').Region} d
   */
  function combineKeywords(d) {
    return `${d.id} ${d.displayName}`;
  }

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
  <Search
    placeholder="Select a Region"
    items={allItems}
    icon="location"
    selectedItem={value ? getInfoByName(value) : defaultRegion}
    labelFieldName="displayName"
    keywordFunction={combineKeywords}
    maxItemsToShowInList="5"
    on:change={(e) => {
      const id = e.detail.id;
      if (!id || e.detail === defaultRegion) {
        syncedValue = '';
      } else {
        syncedValue = id;
      }
    }}
  />
</div>
