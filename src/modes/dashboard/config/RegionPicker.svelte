<script>
  import Search from '../../../components/Search.svelte';
  import { nameInfos, nationInfo } from '../../../data/regions';

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

  let value = '';
</script>

<div>
  <label for="widget-adder-r" class="uk-form-label">Geographic Region</label>
  <input type="hidden" {value} name="region" />
  <Search
    placeholder="Select a Region"
    items={nameInfos}
    icon="location"
    selectedItem={region}
    labelFieldName="displayName"
    keywordFunction={combineKeywords}
    maxItemsToShowInList="5"
    on:change={(e) => {
      const id = e.detail.id || nationInfo.id;
      if (id === region.id) {
        value = '';
      } else {
        value = id;
      }
    }}
  />
</div>
