<script>
  import { getStateOfCounty } from '../../data/regions';

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow & import('../../data/regions').NameInfo}
   */
  export let item;

  $: state = item != null && (item.level === 'county' || item.level === 'mega-county') ? getStateOfCounty(item) : null;
</script>

<div aria-label="tooltip" class="tooltip" class:hidden>
  <h5>
    {#if item}
      {item.displayName}
    {:else}
      N/A
    {/if}
  </h5>
</div>

<style>
  .hidden {
    display: none;
  }

  h5 {
    margin: 0;
    padding: 0;
  }
</style>
