<script>
  import chevronDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
  import chevronUpIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-up.svg';

  export let label;
  /**
   * @type {import('./tableUtils').SortHelper}
   */
  export let sort;
  /**
   * @type {string}
   */
  export let prop;

  export let defaultDesc = false;

  $: sorted = $sort.sortCriteria === prop;
  $: desc = $sort.sortCriteriaDesc;

  function toggleSort() {
    sort.change(prop, defaultDesc);
  }
</script>

<span>
  <button
    class="inline-svg-icon sort-indicator"
    class:active={sorted}
    on:click={toggleSort}
    title="Sort {label} {desc ? 'ascending' : 'descending'}"
  >
    {#if sorted && desc}
      {@html chevronDownIcon}
    {:else}
      {@html chevronUpIcon}
    {/if}
  </button>
</span>

<style>
  .sort-indicator {
    border: none;
    background: none;
    font-weight: inherit;
    text-transform: uppercase;
    color: inherit;
    opacity: 0.4;
    padding: 0;
    cursor: pointer;
  }

  .sort-indicator:hover,
  .sort-indicator.active {
    opacity: 1;
  }
</style>
