<script>
  /* eslint-disable no-undef */
  import Search from './Search.svelte';
  import SensorBadges from './SensorBadges.svelte';

  export let modern = false;
  export let items;
  export let selectedItem = undefined;
  export let selectedItems = undefined;
  export let className = '';

  /**
   * @param {import('../stores/params').Sensor} d
   */
  function combineKeywords(d) {
    return `${d.id} ${d.type} ${d.format} ${d.signal} ${d.name}`;
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
  selectOnClick
  labelFieldName="name"
  keywordFunction={combineKeywords}
  maxItemsToShowInList={11}
  on:change
  on:add
>
  <svelte:fragment slot="entry" let:label let:item let:onClick>
    <a
      class="search-box-link sensor-search-elem"
      href="?signal={item ? item.key : ''}"
      on:click|preventDefault={onClick}
    >
      {@html label}
    </a>
    <div>
      <SensorBadges sensor={item} />
    </div>
  </svelte:fragment>
</Search>

<style>
  .sensor-search-elem {
    padding: 10px 0 0 0;
    line-height: 1;
  }
</style>
