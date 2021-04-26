<script>
  import Search from '../../../components/Search.svelte';
  import { getInfoByName, nameInfos, nationInfo } from '../../../data/regions';

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
</script>

<div>
  <label for="widget-adder-r" class="uk-form-label">Geographic Region</label>
  <input type="hidden" value={syncedValue} name="region" />
  <Search
    placeholder="Select a Region"
    items={nameInfos}
    icon="location"
    selectedItem={value ? getInfoByName(value) : region.value}
    labelFieldName="displayName"
    keywordFunction={combineKeywords}
    maxItemsToShowInList="5"
    on:change={(e) => {
      const id = e.detail.id || nationInfo.id;
      if (id === region.id) {
        syncedValue = '';
      } else {
        syncedValue = id;
      }
    }}
  />
</div>
