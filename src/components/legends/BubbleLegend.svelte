<script>
  import { ENCODING_BUBBLE_THEME } from '../../theme';
  import {
    stats,
    currentLevel,
    colorScale,
    bubbleRadiusScale,
    currentSensorEntry,
    signalCasesOrDeathOptions,
  } from '../../stores';
  import { transparent } from '../../util';
  import { generateLabels } from '../MapBox/colors';
  import './ticks.css';

  export let loading = false;

  $: r = generateLabels($stats, $currentSensorEntry, $currentLevel, $colorScale, $signalCasesOrDeathOptions);
  $: maxHeight = $bubbleRadiusScale(r.highValue) * 2;
</script>

<style>
  ul {
    justify-content: space-evenly;
  }

  li {
    align-items: center;
    justify-content: center;
  }

  .bubble {
    border: 1px solid #666;
    border-radius: 50%;
    max-width: 200px;
    max-height: 200px;
  }
</style>

<ul class="legend-ticks" class:loading-bg={loading}>
  {#each r.labels as l}
    <li class="legend-tick legend-tick-centered" title={l.label} style="height: {maxHeight}px">
      <div
        class="bubble"
        style="width: {$bubbleRadiusScale(l.value) * 2}px; height: {$bubbleRadiusScale(l.value) * 2}px;background: {transparent(l.color, ENCODING_BUBBLE_THEME.opacity)};border-color:
        {l.color}" />
    </li>
  {/each}
  <li class="legend-tick legend-tick-centered" title={r.high} style="height: {maxHeight}px">
    <div
      style="width: {$bubbleRadiusScale(r.highValue) * 2}px; height: {$bubbleRadiusScale(r.highValue) * 2}px;background:
      {transparent(r.highColor, ENCODING_BUBBLE_THEME.opacity)};border-color: {r.highColor}"
      class="bubble" />
  </li>
</ul>
