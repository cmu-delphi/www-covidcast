<script>
  import { getContext } from 'svelte';
  import SensorUnit from '../../../components/SensorUnit.svelte';
  import KPIValue from '../../../components/KPIValue.svelte';
  import { WidgetHighlight } from '../highlight';
  import WidgetCard, { DEFAULT_WIDGET_STATE } from './WidgetCard.svelte';

  export let id = undefined;
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

  export let initialState = {
    ...DEFAULT_WIDGET_STATE,
    height: 2,
  };

  /**
   * @type {import("../../../stores/DataFetcher").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  $: data = fetcher.fetch1Sensor1Region1DateDetails(sensor, region, date);
  $: highlighted =
    highlight != null && highlight.matches(sensor.value, region.value, sensor.isWeeklySignal ? date.week : date.value);

  $: selfHighlight = new WidgetHighlight(sensor.value, region.value, sensor.isWeeklySignal ? date.week : date.value);

  function onMouseEnter() {
    if (!selfHighlight.equals(highlight)) {
      highlight = selfHighlight;
    }
  }
  function onMouseLeave() {
    highlight = null;
  }
</script>

<WidgetCard {highlighted} {sensor} {date} {region} titleUnit={false} {initialState} on:action on:state {id}>
  <div class="kpi" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
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
</WidgetCard>

<style>
  .kpi {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
