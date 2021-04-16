<script>
  import { getContext } from 'svelte';
  import TrendIndicator from '../../mobile/TrendIndicator.svelte';
  import TrendTextSummary from '../../mobile/TrendTextSummary.svelte';
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

<WidgetCard {highlighted}>
  <div class="content" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
    <WidgetTitle {sensor} {date} {region} unit={false}>
      {region.displayName}
    </WidgetTitle>
    <div class="kpi">
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
