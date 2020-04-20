<script>
  import { signalType, stats, currentSensor } from "./stores.js";
  import { DIRECTION_THEME } from "./theme.js";
  import * as d3 from "d3";

  let high = 1;
  let low = 0;

  currentSensor.subscribe(s => ($stats ? updateLowHigh(s, $stats) : ""));
  stats.subscribe(s => (s ? updateLowHigh($currentSensor, s) : ""));

  function updateLowHigh(sens, stats) {
    let sts = stats.get(sens);
    let valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];

    let h = Math.min(100, valueMinMax[1]).toFixed(2) + "%";
    let l = Math.max(0, valueMinMax[0]).toFixed(2) + "%";
    if (sens === "ght") {
      h = valueMinMax[1].toFixed(2);
      l = Math.max(0, valueMinMax[0]).toFixed(2);
    }

    high = h;
    low = l;
  }
</script>

<style>
  .legend {
    font-size: 0.8rem;
    /* border-radius: 8px; */
    padding: 10px 10px;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.7);
    transition: all 0.1s ease-in;
    height: 100%;
  }

  .legend:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }

  .legend.value {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .color {
    width: 20px;
    height: 100%;
    /* border-radius: 50%; */
    margin-right: 10px;
    display: inline-block;
    /* border: 1px solid #dbdbdb; */
    border-top-style: none;
  }

  .legend p {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    color: rgba(0, 0, 0, 0.7);
    margin: 0px 0px;
    padding: 0px;
  }

  .direction-indicators {
    margin-right: 6px;
  }

  .legend-bar {
    width: 20px;
    height: 100%;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .direction-p {
    height: 33%;
  }
</style>

<div
  aria-label="legend"
  class="legend {$signalType === 'value' ? 'value' : ''}">
  {#if $signalType === 'direction'}
    <p class="direction-p">
      <span
        class="color inc"
        style="background-color: {DIRECTION_THEME.increasing}" />
      <span aria-hidden="true" class="direction-indicators inc">&#8599;</span>
      Increasing
    </p>
    <p class="direction-p">
      <span
        class="color const"
        style="background-color: {DIRECTION_THEME.steady}" />
      <span aria-hidden="true" class="direction-indicators const">&#8594;</span>
      Steady
    </p>
    <p class="direction-p">
      <span
        class="color dec"
        style="background-color: {DIRECTION_THEME.decreasing}" />
      <span aria-hidden="true" class="direction-indicators dec">&#8600;</span>
      Decreasing
    </p>
  {:else}
    <p>{high}</p>
    <div
      class="legend-bar"
      style="background: linear-gradient(to top, {DIRECTION_THEME.gradientMin}, {DIRECTION_THEME.gradientMiddle},
      {DIRECTION_THEME.gradientMax})" />
    <p>{low}</p>
  {/if}
</div>
