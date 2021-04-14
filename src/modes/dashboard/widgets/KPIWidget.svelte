<script>
  import { getContext } from 'svelte';
  import SensorUnit from '../../mobile/SensorUnit.svelte';
  import SurveyValue from '../../survey/SurveyValue.svelte';
  import WidgetCard from './WidgetCard.svelte';

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

<WidgetCard flex highlight={highlighted}>
  <div>
    {#await data}
      <SurveyValue value={null} />
    {:then d}
      <SurveyValue value={d ? d.value : null} />
    {/await}
  </div>
  <div>
    <SensorUnit {sensor} long />
  </div>
</WidgetCard>

<style>
</style>
