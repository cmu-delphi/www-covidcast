<script>
  import Vega from '../../components/Vega.svelte';
  import { getStateOfCounty } from '../../maps';
  import { generateStateMapWithCountyDataSpec } from '../../specs/mapSpec';
  import { isMobileDevice, stats } from '../../stores';
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
    domain: sensor.domain($stats, 'county'),
    scheme: sensor.isInverted ? 'yellowgreenblue' : 'yelloworangered',
  });
  $: data = fetcher.fetch1SensorNRegions1Date(sensor, 'county', '*', date);

  function onClickHandler(evt) {
    const item = evt.detail.item;
    if ($isMobileDevice || !item || !item.datum || !item.datum.propertyId) {
      return; // no click on mobile
    }
    region.set(getStateOfCounty(item.datum), true);
  }
</script>

<div class="chart-aspect-4-3">
  <Vega
    {spec}
    {data}
    tooltip={RegionMapTooltip}
    tooltipProps={{ sensor, regionSetter: region.set }}
    on:click={onClickHandler}
    eventListeners={['click']} />
</div>
