<script>
  import Vega from '../components/vega/Vega.svelte';
  import { formatDateISO } from '../formats';
  import { getStateOfCounty } from '../data/regions';
  import { generateStateMapWithCountyDataSpec } from '../specs/mapSpec';
  import { isMobileDevice } from '../stores';
  import DownloadMenu from '../components/DownloadMenu.svelte';
  import RegionMapTooltip from './RegionMapTooltip.svelte';

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

  $: spec = generateStateMapWithCountyDataSpec({
    domain: sensor.domain('county'),
    scheme: sensor.value.vegaColorScale,
  });
  $: data = fetcher.fetch1SensorNRegions1Date(sensor, 'county', date);

  function onClickHandler(evt) {
    const item = evt.detail.item;
    if ($isMobileDevice || !item || !item.datum || !item.datum.propertyId) {
      return; // no click on mobile
    }
    region.set(getStateOfCounty(item.datum), true);
  }

  let vegaRef = null;
</script>

<div class="chart-aspect-4-3">
  <Vega
    bind:this={vegaRef}
    {spec}
    {data}
    tooltip={RegionMapTooltip}
    tooltipProps={{ sensor, regionSetter: region.set }}
    on:click={onClickHandler}
    eventListeners={['click']}
  />
  <DownloadMenu
    {vegaRef}
    {data}
    {sensor}
    absolutePos
    fileName="{sensor.name}_US Counties_{formatDateISO(date.value)}"
  />
</div>
