<script>
  /* eslint-disable no-undef */
  import Search from './Search.svelte';

  export let modern = false;
  export let items;
  export let selectedItem = undefined;
  export let selectedItems = undefined;
  export let className = '';

  /**
   * @param {import('../data/meta').SensorSource} d
   */
  function combineKeywords(d) {
    return `${d.source} ${d.name}`;
  }
</script>

<Search
  {className}
  {modern}
  placeholder="Select Data Source"
  {items}
  title="Data Source"
  icon="database"
  {selectedItem}
  {selectedItems}
  selectOnClick
  labelFieldName="name"
  keywordFunction={combineKeywords}
  maxItemsToShowInList={11}
  on:change
  on:add
>
  <svelte:fragment slot="entry" let:label let:item let:onClick>
    <a
      class="sensor-search-elem"
      href="?sensor={item ? `${item.source}-${item.reference_signal}` : ''}"
      on:click|preventDefault={onClick}
    >
      {@html label} ({item ? item.source : ''})
    </a>
  </svelte:fragment>
</Search>

<style>
  .sensor-search-elem {
    padding: 10px 0 0 0;
    line-height: 1;
  }
</style>
