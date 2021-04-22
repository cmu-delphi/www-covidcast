<script>
  import { getContext } from 'svelte';
  import TrendIndicator from '../../../components/TrendIndicator.svelte';
  import TrendTextSummary from '../../../components/TrendTextSummary.svelte';
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
    width: 2,
    height: 2,
  };

  /**
   * @type {import("../../../stores/params").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  $: data = fetcher.fetchWindowTrend(sensor, region, date);
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

<WidgetCard {highlighted} {sensor} {date} {region} titleUnit={false} {initialState} on:state on:close {id}>
  <div class="content">
    <div class="kpi" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
      <div>
        {#await data}
          <TrendIndicator trend={null} long />
        {:then d}
          <TrendIndicator trend={d} long />
        {/await}
      </div>
    </div>
    <TrendTextSummary {sensor} {date} trend={data} />
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
