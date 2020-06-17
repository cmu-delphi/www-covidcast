<script>
  import { signalType, stats, currentSensor, sensorMap, currentLevel } from './stores.js';
  import { DIRECTION_THEME } from './theme.js';
  import * as d3 from 'd3';

  let high = '';
  let low = '';

  currentSensor.subscribe(s => ($stats ? updateLowHigh(s, $stats, $currentLevel) : ''));
  stats.subscribe(s => (s ? updateLowHigh($currentSensor, s, $currentLevel) : ''));
  currentLevel.subscribe(l => ($stats ? updateLowHigh($currentSensor, $stats, l) : ''));

  function updateLowHigh(sens, stats, level) {
    let sts;
    let valueMinMax;

    if ($currentSensor.match(/num/)) {
      sts = stats.get(sens + '_' + level);
      valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];

      /*
      high = Math.round(valueMinMax[1]);
      low = Math.round(Math.max(0, valueMinMax[0]));
      */
      high = valueMinMax[1].toFixed(2);
      low = Math.max(0, valueMinMax[0]).toFixed(2);
    } else {
      sts = stats.get(sens);
      valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];
      if ($sensorMap.get($currentSensor).format === 'raw') {
        high = valueMinMax[1].toFixed(2);
        low = Math.max(0, valueMinMax[0]).toFixed(2);
      } else {
        high = Math.min(100, valueMinMax[1]).toFixed(2) + '% ';
        low = Math.max(0, valueMinMax[0]).toFixed(2) + '% ';
      }
    }
    colorArr = [{ label: '0', color: DIRECTION_THEME.countMin }];
    var max = Math.log(valueMinMax[1]) / Math.log(10);
    var min = Math.log(Math.max(0.01, valueMinMax[0])) / Math.log(10);

    var arr = logspace(min, max, 7);
    const colorScaleLog = d3.scaleSequentialLog(d3.interpolateYlOrRd).domain([valueMinMax[0], valueMinMax[1]]);
    for (var i = 0; i < arr.length; i++) {
      //arr[i] = Math.round(arr[i]);
      arr[i] = parseFloat(arr[i]).toFixed(2);
      if (i == arr.length - 1) {
        colorArr.push({ label: arr[i] + '+', color: colorScaleLog(arr[i]) });
      } else {
        colorArr.push({ label: arr[i] + ' - ' + parseFloat(arr[i + 1]).toFixed(2), color: colorScaleLog(arr[i]) });
      }
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
  {:else if $currentSensor.match(/num/)}
    <p>{high ? high + '+' : ''}</p>
    <div
      class="legend-bar"
      style="background: linear-gradient(to top, {DIRECTION_THEME.countMin} 2% ,{DIRECTION_THEME.gradientMin} 2%, {DIRECTION_THEME.gradientMiddle}
      51%, {DIRECTION_THEME.gradientMax} 100%)" />
    <p>{low}</p>
  {:else}
    <p>{high ? high + '+' : ''}</p>
    <div
      class="legend-bar"
      style="background: linear-gradient(to top, {DIRECTION_THEME.gradientMin}, {DIRECTION_THEME.gradientMiddle}, {DIRECTION_THEME.gradientMax})" />
    <p>{low}</p>
  {/if}
</div>
