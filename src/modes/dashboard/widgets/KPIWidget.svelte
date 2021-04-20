<script>
  import { getContext } from 'svelte';
  import SensorUnit from '../../../components/SensorUnit.svelte';
  import KPIValue from '../../../components/KPIValue.svelte';
  import { WidgetHighlight } from '../highlight';
  import WidgetCard from './WidgetCard.svelte';
  import WidgetTitle from './WidgetTitle.svelte';

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
  $: highlighted = highlight != null && highlight.matches(sensor.value, region.value, date.value);

  $: selfHighlight = new WidgetHighlight(sensor.value, region.value, date.value);

  function onMouseEnter() {
    if (!selfHighlight.equals(highlight)) {
      highlight = selfHighlight;
    }
  }
  function onMouseLeave() {
    highlight = null;
  }
</script>

<WidgetCard {highlighted}>
  <div class="content" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
    <WidgetTitle {sensor} {date} {region} unit={false} />
    <div class="kpi">
      <div>
        {#await data}
          <KPIValue value={null} />
        {:then d}
          <KPIValue value={d ? d.value : null} />
        {/await}
      </div>
      <div>
        <SensorUnit {sensor} long />
      </div>
    </div>
  </div>
</WidgetCard>

<style>
  .content {
    display: flex;
    flex-direction: column;
  }
  .kpi {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
