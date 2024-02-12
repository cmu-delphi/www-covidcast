<script>
  import mousePointerIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/regular/hand-pointer.svg';
  import RegionCountyMap from './RegionCountyMap.svelte';
  import RegionHexMap from './RegionHexMap.svelte';
  import RegionMap from './RegionMap.svelte';
  import Toggle from '../components/Toggle.svelte';
  import HospitalAdmissionsIndicatorWarning from './HospitalAdmissionsIndicatorWarning.svelte';
  import { currentDateObject } from '../stores';
  import { DateParam } from '../stores/params';

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

  let suffix = '';

  $: hasCounties = sensor.value.levels.includes('county');
  let showChoropleth = false;

  $: hospitalAdmissionMaxDate = sensor.timeFrame.max;
  $: if (hospitalAdmissionMaxDate < date.value) {
    hospitalAdmissionMaxDate = new DateParam($currentDateObject);
    hospitalAdmissionMaxDate.set(sensor.timeFrame.max);
  }
</script>

{#if region.level === 'nation'}
  <p class="uk-text-center uk-text-italic ux-hint">
    <span class="inline-svg-icon">
      {@html mousePointerIcon}
    </span>
    Click on a state to explore further
  </p>

  <div class="toggle-center-wrapper">
    <Toggle bind:checked={showChoropleth} before="Beehive Grid"
      ><span>
        Choropleth Map
        {#if showChoropleth && hasCounties}{suffix}{/if}</span
      ></Toggle
    >
  </div>
  {#if showChoropleth}
    {#if hasCounties}
      <RegionCountyMap {region} {date} {sensor} {fetcher} bind:suffix />
    {:else}
      <RegionMap {region} {date} {sensor} {fetcher} />
    {/if}
  {:else}
    <HospitalAdmissionsIndicatorWarning {date} {region} {sensor} {fetcher} />
    <RegionHexMap {region} {date} {sensor} {fetcher} {hospitalAdmissionMaxDate} />
  {/if}
{:else}
  <RegionMap {region} {date} {sensor} {fetcher} />
{/if}

<style>
  .toggle-center-wrapper > :global(*) {
    display: flex !important;
    padding-top: 0;
    text-align: center;
    align-items: center;
    justify-content: center;
    margin-right: 0;
  }
  .toggle-center-wrapper > :global(* > svg) {
    margin-left: -0.4em;
    margin-right: 1.4em;
  }

  .toggle-center-wrapper :global(span) {
    width: 9em;
  }

  .ux-hint {
    font-size: 90%;
  }
</style>
