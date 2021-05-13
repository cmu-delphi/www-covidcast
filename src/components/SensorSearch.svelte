<script>
  /* eslint-disable no-undef */
  import Search from './Search.svelte';

  export let modern = false;
  export let items;
  export let selectedItem = undefined;
  export let selectedItems = undefined;
  export let className = '';

  /**
   * @param {import('../stores/params').Sensor} d
   */
  function combineKeywords(d) {
    return `${d.id} ${d.signal} ${d.name}`;
  }
</script>

<Search
  {className}
  {modern}
  placeholder="Select Indicator"
  {items}
  title="Indicator"
  icon="database"
  {selectedItem}
  {selectedItems}
  labelFieldName="name"
  keywordFunction={combineKeywords}
  maxItemsToShowInList={15}
  on:change
  on:add
>
  <svelte:fragment slot="entry" let:listItem let:onClick>
    <a href="?signal={listItem.item ? listItem.item.key : ''}" on:click|preventDefault={onClick}>
      {#if listItem.highlighted}
        {@html listItem.highlighted.label}
      {:else}
        {listItem.label}
      {/if}
    </a>
  </svelte:fragment>
</Search>
