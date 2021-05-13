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
  labelFieldName="displayName"
  keywordFunction={combineKeywords}
  maxItemsToShowInList={15}
  on:change
  on:add
>
  <svelte:fragment slot="entry" let:listItem let:onClick>
    <a href="?region={listItem.item ? listItem.item.id : ''}" on:click|preventDefault={onClick}>
      {#if listItem.highlighted}
        {@html listItem.highlighted.label}
      {:else}
        {listItem.label}
      {/if}
      <GeoLevelBadge region={listItem.item} />
    </a>
  </svelte:fragment>
</Search>
