<script>
  import { createEventDispatcher } from 'svelte';
  import AutoComplete from 'simple-svelte-autocomplete';
  import IoIosSearch from 'svelte-icons/io/IoIosSearch.svelte';

  const dispatch = createEventDispatcher();

  export let regionList = [];
  export let selectedRegion = '';
  let className = '';
  export { className as class };

  function onSearch() {
    if (typeof selectedRegion !== 'undefined' && selectedRegion !== '') {
      dispatch('search', selectedRegion);
    }
  }
</script>

<style>
  .root {
    flex: 1 1 0;
    display: flex;
    padding: 0 0.2em;
    align-items: center;
  }

  .search-icon {
    color: #9b9b9b;
    width: 1.4em;
    margin: 0 0.2em;
    padding: 5px 0;
    display: flex;
    align-self: flex-start;
    align-items: center;
  }

  .search {
    flex-grow: 1;
  }

  /* search bar */

  :global(.search-bar .input.autocomplete-input) {
    border-color: transparent !important;
    background-color: transparent !important;
    padding-left: 6px !important;
    padding-right: 6px !important;
    width: 95% !important;
    color: #111 !important;
  }

  :global(.search-bar .input.autocomplete-input:focus) {
    outline: none !important;
    background-color: transparent !important;
    border-bottom: solid 1px var(--red) !important;
  }

  :global(.search-bar .autocomplete-list) {
    padding-top: 3px !important;
    padding-left: 3px !important;
    border-color: transparent !important;
    background-color: transparent !important;
    width: 96% !important;
  }

  :global(.search-bar .autocomplete-list .autocomplete-list-item) {
    border-radius: 5px !important;
    background-color: transparent !important;
    transition: all 0.1s ease-in !important;
  }

  :global(.search-bar .autocomplete-list .autocomplete-list-item.selected, .search-bar
      .autocomplete-list
      .autocomplete-list-item:hover) {
    background-color: var(--red) !important;
    border-radius: 5px !important;
    color: #fff !important;
  }
</style>

<div class="root base-font-size {className}">
  <div class="search-icon">
    <IoIosSearch />
  </div>
  <div class="search">
    <AutoComplete
      className="search-bar"
      placeholder="Search for a location..."
      items={regionList}
      bind:selectedItem={selectedRegion}
      labelFieldName="display_name"
      maxItemsToShowInList="5"
      onChange={onSearch} />
  </div>
</div>
