<script>
  import RegionCountyMap from './RegionCountyMap.svelte';
  import RegionHexMap from './RegionHexMap.svelte';
  import RegionMap from './RegionMap.svelte';
  import Toggle from '../components/Toggle.svelte';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  let showCounties = false;
</script>

{#if region.level === 'nation'}
  <p class="uk-text-center">Click on a state to show this region</p>
  <div class="toggle-center-wrapper">
    <Toggle bind:checked={showCounties} before="Show US States as Beehive Grid">
      Show US Counties as Choropleth Map
    </Toggle>
  </div>
  {#if showCounties}
    <RegionCountyMap {region} {date} {sensor} {fetcher} />
  {:else}
    <RegionHexMap {region} {date} {sensor} {fetcher} />
  {/if}
{:else}
  <RegionMap {region} {date} {sensor} {fetcher} />
{/if}

<style>
  .toggle-center-wrapper > :global(*) {
    display: flex;
    padding-top: 0;
    text-align: center;
    align-items: center;
    justify-content: center;
  }
  .toggle-center-wrapper > :global(* > svg) {
    margin-left: -0.4em;
    margin-right: 1.4em;
  }
</style>
