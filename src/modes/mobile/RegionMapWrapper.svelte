<script>
  import RegionCountyMap from './RegionCountyMap.svelte';
  import RegionHexMap from './RegionHexMap.svelte';
  import RegionMap from './RegionMap.svelte';
  import Toggle from './Toggle.svelte';

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
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  let showCounties = false;
</script>

{#if region.level === 'nation'}
  <p class="uk-text-center">
    Click on a state to show this region
    <Toggle bind:checked={showCounties}>
      <span slot="before">Show US States as Beehive Grid</span>
      Show US Counties as Choropleth Map
    </Toggle>
  </p>
  {#if showCounties}
    <RegionCountyMap {region} {date} {sensor} {fetcher} />
  {:else}
    <RegionHexMap {region} {date} {sensor} {fetcher} />
  {/if}
{:else}
  <RegionMap {region} {date} {sensor} {fetcher} />
{/if}
