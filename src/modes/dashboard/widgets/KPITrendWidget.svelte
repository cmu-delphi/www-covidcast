<script context="module">
  const DEFAULT_STATE = {
    ...DEFAULT_WIDGET_STATE,
    width: 2,
    height: 2,
  };
</script>

<script>
  import { getContext } from 'svelte';
  import KPIValue from '../../../components/KPIValue.svelte';
  import SensorUnit from '../../../components/SensorUnit.svelte';
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

  export let initialState = DEFAULT_STATE;

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

<WidgetCard
  {highlighted}
  {sensor}
  {date}
  {region}
  titleUnit={false}
  {initialState}
  defaultState={DEFAULT_STATE}
  on:state
  on:action
  {id}
>
  <div class="content">
    <div class="kpi" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
      <div class="kpi-two-col">
        <div>
          <div>
            {#await data}
              <KPIValue value={null} />
            {:then d}
              <KPIValue value={d && d.current ? d.current.value : null} />
            {/await}
          </div>
          <div>
            <SensorUnit {sensor} long />
          </div>
        </div>
        <div>
          {#await data}
            <TrendIndicator trend={null} long />
          {:then d}
            <TrendIndicator trend={d} long />
          {/await}
        </div>
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
  }
  .kpi-two-col {
    display: flex;
    flex-grow: 1;
    align-items: center;
    justify-content: space-evenly;
  }
  .kpi-two-col > div {
    flex: 1 1 0;
    text-align: center;
  }
</style>
