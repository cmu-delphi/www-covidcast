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
  <div class="grid-3-11">
    <p>Click on a state to show this region</p>
    <Toggle bind:checked={showCounties}>
      <span slot="before">Show US States as Beehive Grid</span>
      Show US Counties as Choropleth Map
    </Toggle>
  </div>
  <div class="grid-2-12">
    {#if showCounties}
      <RegionCountyMap {region} {date} {sensor} {fetcher} />
    {:else}
      <RegionHexMap {region} {date} {sensor} {fetcher} />
    {/if}
  </div>
{:else}
  <div class="grid-2-12">
    <RegionMap {region} {date} {sensor} {fetcher} />
  </div>
{/if}
