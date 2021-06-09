<script>
  import IndicatorAnnotation from '../../../components/IndicatorAnnotation.svelte';
  import { annotationManager } from '../../../stores';

  import { WidgetHighlight } from '../highlight';
  import WidgetCard, { DEFAULT_WIDGET_STATE } from './WidgetCard.svelte';

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").TimeFrame}
   */
  export let timeFrame;
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

  $: selfHighlight = new WidgetHighlight(sensor.value, region.value, timeFrame);
  $: highlighted = highlight != null && highlight.matches(sensor.value, region.value, timeFrame);

  function onMouseEnter() {
    if (!selfHighlight.equals(highlight)) {
      highlight = selfHighlight;
    }
  }
  function onMouseLeave() {
    highlight = null;
  }

  $: annotations = $annotationManager.getWindowAnnotations(sensor.value, region.value, timeFrame.min, timeFrame.max);
</script>

<WidgetCard
  {highlighted}
  {sensor}
  date={timeFrame}
  {region}
  titleUnit="data anomalies"
  {initialState}
  resizeMode="y"
  on:action
  on:state
  {id}
>
  <div class="annotations" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
    <div class="scroll-wrapper">
      {#each annotations as annotation}
        <IndicatorAnnotation {annotation} />
      {/each}
    </div>
    {#if annotations.length === 0}
      <div class="no">No data anomalies recorded</div>
    {/if}
  </div>
</WidgetCard>

<style>
  .annotations {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .scroll-wrapper {
    overflow-y: auto;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
  .no {
    text-align: center;
  }
</style>
