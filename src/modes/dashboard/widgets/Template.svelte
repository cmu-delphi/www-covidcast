<script>
  import WidgetCard from './WidgetCard.svelte';
  import { getContext } from 'svelte';
  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  /**
   * @type {import("../../../stores/params").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  $: data = fetcher.fetch1Sensor1Region1DateDetails(sensor, region, date);
  $: highlighted = highlight && highlight.matches(sensor.value, region.value, date.value);
</script>

<WidgetCard highlight={highlighted}>
  <div>
    <div>
      {#await data}
        null
      {:then d}
        {d.value}
      {/await}
    </div>
  </div>
</WidgetCard>

<style>
</style>
