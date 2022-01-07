<script>
  /* eslint-disable no-undef */
  import GeoLevelBadge from './GeoLevelBadge.svelte';
  import Search from './Search.svelte';

  export let modern = false;
  export let items;
  export let selectedItem = undefined;
  export let selectedItems = undefined;
  export let className = '';

  /**
   * @param {import('../stores/params').Region} d
   */
  function combineKeywords(d) {
    return `${d.id} ${d.displayName}`;
  }
</script>

<Search
  {className}
  {modern}
  placeholder="Select Region"
  {items}
  title="Region"
  icon="location"
  selectOnClick
  {selectedItem}
  {selectedItems}
  clear={selectedItems == null}
  labelFieldName="displayName"
  keywordFunction={combineKeywords}
  maxItemsToShowInList={15}
  on:change
  on:add
  on:remove
>
  <svelte:fragment slot="entry" let:label let:item let:onClick>
    <a class="search-box-link" href="?region={item ? item.id : ''}" on:click|preventDefault={onClick}>
      {@html label}
      <GeoLevelBadge region={item} />
    </a>
  </svelte:fragment>
</Search>
