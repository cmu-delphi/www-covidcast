<script>
  import { ENCODING_BUBBLE_THEME } from '../../theme';
  import {
    stats,
    currentLevel,
    colorScale,
    bubbleRadiusScale,
    currentSensorEntry,
    currentDataReadyOnMap,
signalShowCumulative,
  } from '../../stores';
  import { transparent } from '../../util';
  import { getSigfigs, generateLabels } from '../MapBox/colors';

  let high = '';
  let unit = '';
  let labels = [];

  $: {
    const r = generateLabels($stats, $currentSensorEntry, $currentLevel, $signalShowCumulative);
    labels = r.labels;
    high = r.high;
    unit = r.unit;
  }
</script>

<style>
  .bubble-legend {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .bubble-legend li {
    display: flex;
    font-size: 80%;
    padding-right: 10px;
    align-items: center;
  }

  .bubble {
    border: 1px solid #666;
    border-radius: 50%;
    display: inline-block;
    margin-right: 0.3rem;
    max-width: 200px;
    max-height: 200px;
  }
</style>

<ul class="bubble-legend" class:loading-bg={!$currentDataReadyOnMap}>
  {#each labels as [label], j}
    {#if +label > 0}
      <li class="colored">
        <div
          style="width: {$bubbleRadiusScale(+label) * 2}px; height: {$bubbleRadiusScale(+label) * 2}px;background: {transparent($colorScale(+label), ENCODING_BUBBLE_THEME.opacity)};border-color:
          {$colorScale(+label)}"
          class="bubble" />
        <div>{getSigfigs(label, 3)}</div>
      </li>
    {/if}
  {/each}
  {#if high}
    <li class="colored">
      <div
        style="background: {transparent($colorScale(+high), ENCODING_BUBBLE_THEME.opacity)};width: {$bubbleRadiusScale(+high) * 2}px;
        height: {$bubbleRadiusScale(+high) * 2}px;border-color: {$colorScale(+high)}"
        class="bubble" />
      <div>{high ? high + unit + '+' : ''}</div>
    </li>
  {/if}
</ul>
