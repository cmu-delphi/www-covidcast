<script>
  import Vega from '../../components/Vega.svelte';
  import { generateCountySpec } from '../../specs/mapSpec';
  import { stats } from '../../stores';
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

  $: spec = generateCountySpec({
    domain: sensor.domain($stats, 'county'),
    scheme: sensor.isInverted ? 'yellowgreenblue' : 'yelloworangered',
  });
  $: data = fetcher.fetch1SensorNRegions1Date(sensor, 'county', '*', date);
</script>

<div class="chart-aspect-4-3">
  <Vega {spec} {data} tooltip={RegionMapTooltip} tooltipProps={{ sensor, regionSetter: region.set }} />
</div>
