<script>
  import { ENCODING_BUBBLE_THEME, MISSING_COLOR } from '../../theme';
  import {
    stats,
    currentLevel,
    colorScale,
    bubbleRadiusScale,
    currentSensorEntry,
    signalCasesOrDeathOptions,
    isMobileDevice,
  } from '../../stores';
  import { transparent } from '../../util';
  import { generateLabels } from '../MapBox/colors';

  export let zoom = 1.0;

  $: r = generateLabels(
    $stats,
    $currentSensorEntry,
    $currentLevel,
    $colorScale,
    $signalCasesOrDeathOptions,
    $isMobileDevice,
  );
</script>

<ul data-testid="bubble-legend">
  <li>
    <div class="bubble-wrapper">
      <div class="na" style="background:repeating-linear-gradient(-45deg, {MISSING_COLOR}, white 30%)" />
    </div>
    <span>NA</span>
  </li>
  {#each r.labels as l}
    <li>
      <div class="bubble-wrapper">
        <div
          class="bubble"
          style="width: {$bubbleRadiusScale(l.value) * 2 * zoom}px; height: {$bubbleRadiusScale(l.value) *
            2 *
            zoom}px;background:
          {transparent(
            l.color,
            ENCODING_BUBBLE_THEME.fillOpacity,
          )};border-color: {l.color}"
        />
      </div>
      <span>{l.label}</span>
    </li>
  {/each}
  <li>
    <div class="bubble-wrapper">
      <div
        style="width: {$bubbleRadiusScale(r.highValue) * 2 * zoom}px; height: {$bubbleRadiusScale(r.highValue) *
          2 *
          zoom}px;background:
        {transparent(
          r.highColor,
          ENCODING_BUBBLE_THEME.fillOpacity,
        )};border-color: {r.highColor}"
        class="bubble"
      />
    </div>
    <span>{r.high}</span>
  </li>
</ul>

<style>
  ul {
    margin: 0;
    padding: 0;
    display: flex;
    font-size: 80%;
    justify-content: space-evenly;
  }

  li {
    display: flex;
    flex-direction: column;
    list-style: none;
    padding: 0;
    margin: 0 0.2em;
    align-items: center;
    justify-content: center;
    min-width: 2em;
  }

  .bubble-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .bubble {
    border: 1px solid #666;
    border-radius: 50%;
    max-width: 200px;
    max-height: 200px;
  }

  .na {
    width: 2em;
    height: 2em;
  }
</style>
