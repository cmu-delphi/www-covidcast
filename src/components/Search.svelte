<script>
  import { createEventDispatcher } from 'svelte';
  import AutoComplete from 'simple-svelte-autocomplete';
  import IoIosSearch from 'svelte-icons/io/IoIosSearch.svelte';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';

  const dispatch = createEventDispatcher();

  export let regionList = [];
  export let selectedRegion = '';
  let className = '';
  export { className as class };

  /**
   * @type {HTMLElement | null}
   */
  let root = null;
  let searchVisible = false;

  export let mobile = false;

  function toggleSearchField() {
    if (selectedRegion) {
      return;
    }
    searchVisible = !searchVisible;
    if (searchVisible && root && root.querySelector('input')) {
      // focus on next frame
      requestAnimationFrame(() => root.querySelector('input').focus());
    }
  }

  function onSearch(value) {
    if (value === selectedRegion) {
      return;
    }
    if (typeof value !== 'undefined' && value !== '') {
      dispatch('search', value);
    }
  }

  function resetSearch() {
    searchVisible = false;
    dispatch('reset');
  }

  $: hideSearchField = mobile && !searchVisible && !selectedRegion;
</script>

<style>
  .root {
    flex: 1 1 0;
    display: flex;
    padding: 0 0.2em;
    align-items: center;
  }

  .search-button {
    color: #9b9b9b;
    width: 1.4em;
    margin: 0 0.2em;
    padding: 5px 0;
    display: flex;
    align-self: flex-start;
    align-items: center;
    border: none;
    background: none;
  }

  .reset-button {
    z-index: 1;
    margin-left: -1.6em;
  }

  .search {
    flex-grow: 1;
    width: 27em;
  }

  .hidden {
    display: none;
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

<div bind:this={root} class="root {className}">
  <button
    class="search-button"
    class:pg-button={mobile}
    disabled={!mobile}
    title="Show Search Field"
    aria-label="Show Search Field"
    on:click={toggleSearchField}>
    <IoIosSearch />
  </button>
  <div class="search" class:hidden={hideSearchField}>
    <AutoComplete
      className="search-bar"
      placeholder="Search for a location..."
      items={regionList}
      selectedItem={selectedRegion}
      labelFieldName="display_name"
      maxItemsToShowInList="5"
      onChange={onSearch} />
  </div>
  <button
    class="pg-button search-button reset-button"
    class:hidden={hideSearchField || !selectedRegion}
    on:click={resetSearch}
    title="Clear Search Field"
    aria-label="Clear Search Field">
    <IoIosClose />
  </button>
</div>
