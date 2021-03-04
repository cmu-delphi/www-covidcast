<script>
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

<RegionMap {region} {date} {sensor} {fetcher} />
<RegionHexMap {region} {date} {sensor} {fetcher} />
{#if region.level === 'nation'}
  <Toggle bind:checked={showCounties}>Show US Counties</Toggle>
{/if}
