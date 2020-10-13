<script>
  import { currentDateObject } from '../../stores';
  import Vega from '../../components/Vega.svelte';
  import VegaTooltip from '../../components/DetailView/VegaTooltip.svelte';

  export let s;
  export let highlightTimeValue;
  export let onClick;
  export let onHighlight;
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
    noDataText={s.noDataText}
    signals={{ currentDate: $currentDateObject, highlightTimeValue }}
    signalListeners={['highlight']}
    eventListeners={['click']}
    on:click={onClick}
    on:signal={onHighlight}
    tooltip={VegaTooltip}
    tooltipProps={{ sensor: s.sensor }} />
</div>
