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

  export let loading = false;

  $: r = generateLabels($stats, $currentSensorEntry, $currentLevel, $colorScale, $signalCasesOrDeathOptions);
  $: maxHeight = $bubbleRadiusScale(r.highValue) * 2;
</script>

<style>
  ul {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: space-evenly;
    font-size: 80%;
  }

  li {
    margin: 0;
    padding: 0;
    list-style: none;
    flex: 2 2 0;
    min-width: 5em;
    margin-bottom: 1em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  li.tick::after {
    content: attr(title);
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    text-align: center;
  }

  .bubble {
    border: 1px solid #666;
    border-radius: 50%;
    max-width: 200px;
    max-height: 200px;
  }
</style>

<ul class:loading-bg={loading}>
  {#each r.labels as l}
    <li class="tick" title={l.label} style="height: {maxHeight}px">
      <div
        class="bubble"
        style="width: {$bubbleRadiusScale(l.value) * 2}px; height: {$bubbleRadiusScale(l.value) * 2}px;background: {transparent(l.color, ENCODING_BUBBLE_THEME.opacity)};border-color:
        {l.color}" />
    </li>
  {/each}
  <li class="tick" title={r.high} style="height: {maxHeight}px">
    <div
      style="width: {$bubbleRadiusScale(r.highValue) * 2}px; height: {$bubbleRadiusScale(r.highValue) * 2}px;background:
      {transparent(r.highColor, ENCODING_BUBBLE_THEME.opacity)};border-color: {r.highColor}"
      class="bubble" />
  </li>
</ul>
