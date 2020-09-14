<script>
  import { currentDateObject } from '../../stores';
  import Vega from '../../components/Vega.svelte';
  import { onDestroy } from 'svelte';
  import { createVegaTooltipAdapter } from '../../components/tooltipUtils';
  import SmallMultipleTooltip from './SmallMultipleTooltip.svelte';

  export let s;
  export let noDataText;
  export let highlightTimeValue;
  export let onClick;
  export let onHighlight;

  const { tooltipHandler, destroyHandler } = createVegaTooltipAdapter(SmallMultipleTooltip, {
    sensor: s.sensor,
  });

  onDestroy(() => {
    destroyHandler();
  });
</script>

<style>
  .single-sensor-chart {
    height: 4em;
  }

  .vega-wrapper {
    position: relative;
  }
  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 2px;
    bottom: 0;
  }
</style>

<div class="single-sensor-chart vega-wrapper">
  <Vega
    data={s.data}
    spec={s.spec}
    {noDataText}
    {tooltipHandler}
    signals={{ currentDate: $currentDateObject, highlightTimeValue }}
    signalListeners={['highlight']}
    eventListeners={['click']}
    on:click={onClick}
    on:signal={onHighlight} />
</div>
