<script>
  import { signalType, stats, currentSensor, sensorMap } from './stores.js';
  import { DIRECTION_THEME } from './theme.js';
  import * as d3 from 'd3';

  let high = '';
  let low = '';

  currentSensor.subscribe(s => ($stats ? updateLowHigh(s, $stats) : ''));
  stats.subscribe(s => (s ? updateLowHigh($currentSensor, s) : ''));

  function updateLowHigh(sens, stats) {
    let sts = stats.get(sens);
    let valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];

    if ($sensorMap.get($currentSensor).format === 'raw') {
      high = valueMinMax[1].toFixed(2);
      low = Math.max(0, valueMinMax[0]).toFixed(2);
    } else {
      high = Math.min(100, valueMinMax[1]).toFixed(2) + '% ';
      low = Math.max(0, valueMinMax[0]).toFixed(2) + '% ';
    }
  }
</script>

<style>
  .legend {
    font-size: 0.8rem;
    /* border-radius: 8px; */
    padding: 10px 10px;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.9);
    transition: all 0.1s ease-in;
    height: 100%;
    display: flex;
    flex-direction: column;
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
    margin-right: 10px;
    display: inline-block;
    border-top-style: none;
    transition: none;
  }

  .legend p {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    color: rgba(0, 0, 0, 0.7);
    margin-right: 5px;
    padding: 0px;
  }

  .legend-bar {
    width: 20px;
    height: 100%;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .direction-p {
    height: 33%;
    display: inline-flex;
    align-items: center;
  }
</style>

<div aria-label="legend" class="legend {$signalType === 'value' ? 'value' : ''}">
  {#if $signalType === 'direction'}
    <div class="direction-p">
      <div class="color inc" style="background-color: {DIRECTION_THEME.increasing}" />
      <p aria-hidden="true" class="direction-indicators inc">
        {@html DIRECTION_THEME.increasingIcon}
      </p>
      <p>Increasing</p>
    </div>
    <div class="direction-p">
      <div class="color inc" style="background-color: {DIRECTION_THEME.steady}" />
      <p aria-hidden="true" class="direction-indicators inc">
        {@html DIRECTION_THEME.steadyIcon}
      </p>
      <p>Steady</p>
    </div>
    <div class="direction-p">
      <div class="color inc" style="background-color: {DIRECTION_THEME.decreasing}" />
      <p aria-hidden="true" class="direction-indicators inc">
        {@html DIRECTION_THEME.decreasingIcon}
      </p>
      <p>Decreasing</p>
    </div>
  {:else}
    <p>{high ? high + '+' : ''}</p>
    <div
      class="legend-bar"
      style="background: linear-gradient(to top, {DIRECTION_THEME.gradientMin}, {DIRECTION_THEME.gradientMiddle}, {DIRECTION_THEME.gradientMax})" />
    <p>{low}</p>
  {/if}
</div>
