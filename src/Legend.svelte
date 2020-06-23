<script>
  import { signalType, stats, currentSensor, sensorMap, currentLevel } from './stores.js';
  import { DIRECTION_THEME } from './theme.js';
  import * as d3 from 'd3';
  import logspace from 'compute-logspace';

  let high = '';
  let low = '';
  $: logColorArr = [{ label: '0', from_color: DIRECTION_THEME.countMin, to_color: DIRECTION_THEME.countMin }];
  $: linColorArr = [
    DIRECTION_THEME.countMin,
    DIRECTION_THEME.countMin,
    DIRECTION_THEME.countMin,
    DIRECTION_THEME.countMin,
    DIRECTION_THEME.countMin,
  ];

  currentSensor.subscribe(s => ($stats ? updateLowHigh(s, $stats, $currentLevel) : ''));
  stats.subscribe(s => (s ? updateLowHigh($currentSensor, s, $currentLevel) : ''));
  currentLevel.subscribe(l => ($stats ? updateLowHigh($currentSensor, $stats, l) : ''));

  function updateLowHigh(sens, stats, level) {
    let sts;
    let valueMinMax;

    if ($currentSensor.match(/num/)) {
      sts = stats.get(sens + '_' + level);
      valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];

      high = sig_figs(valueMinMax[1].toFixed(2), 3);
      low = sig_figs(Math.max(0, valueMinMax[0]).toFixed(2), 3);

      logColorArr = [{ label: '0', from_color: DIRECTION_THEME.countMin, to_color: DIRECTION_THEME.countMin }];
      var max = Math.log(valueMinMax[1]) / Math.log(10);
      var min = Math.log(Math.max(0.14, valueMinMax[0])) / Math.log(10);
      var arr = logspace(min, max, 7);
      const colorScaleLog = d3
        .scaleSequentialLog(d3.interpolateYlOrRd)
        .domain([Math.max(0.14, valueMinMax[0]), valueMinMax[1]]);
      for (var i = 0; i < arr.length - 1; i++) {
        arr[i] = parseFloat(arr[i]).toFixed(2);
        logColorArr.unshift({
          label: arr[i],
          from_color: colorScaleLog(arr[i]),
          to_color: colorScaleLog(arr[i + 1]),
        });
      }
    } else {
      sts = stats.get(sens);
      valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];
      if ($sensorMap.get($currentSensor).format === 'raw') {
        high = sig_figs(valueMinMax[1].toFixed(2), 3);
        low = sig_figs(Math.max(0, valueMinMax[0]).toFixed(2), 3);
        valueMinMax[0] = Math.max(0, valueMinMax[0]);
      } else {
        high = sig_figs(Math.min(100, valueMinMax[1]).toFixed(2), 3) + '% ';
        low = sig_figs(Math.max(0, valueMinMax[0]).toFixed(2), 3) + '% ';
        valueMinMax[1] = Math.min(100, valueMinMax[1]);
      }
      const colorScaleLinear = d3.scaleSequential(d3.interpolateYlOrRd).domain([valueMinMax[0], valueMinMax[1]]);
      let center = valueMinMax[0] + (valueMinMax[1] - valueMinMax[0]) / 2;
      let first_half_center = valueMinMax[0] + (center - valueMinMax[0]) / 2;
      let second_half_center = center + (valueMinMax[1] - center) / 2;
      linColorArr = [
        colorScaleLinear(valueMinMax[0]),
        colorScaleLinear(first_half_center),
        colorScaleLinear(center),
        colorScaleLinear(second_half_center),
        colorScaleLinear(valueMinMax[1]),
      ];
    }
  }

  function sig_figs(value, sigFigs) {
    return parseFloat(parseFloat(value).toPrecision(sigFigs));
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
    justify-content: left;
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
    align-self: first baseline;
  }

  .direction-p {
    height: 33%;
    display: inline-flex;
    align-items: center;
  }

  .count-p {
    height: 14%;
    width: 100%;
    display: inline-flex;
    align-items: center;
  }
  .tick-p {
    height: 1px;
    width: 100%;
    display: inline-flex;
    align-items: center;
  }
  .tick {
    display: block;
    height: 100%;
    margin-right: 30px;
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
    <div class="tick-p">
      <div class="tick" style="background: black" />
      <p>{high ? high + '+' : ''}</p>
    </div>
    {#each logColorArr as { label, from_color, to_color }, i}
      <div class="count-p">
        <div class="color inc" style="background: linear-gradient(to top, {from_color}, {to_color})" />
      </div>
      <div class="tick-p">
        <div class="tick" style="background: black" />
        <p>{sig_figs(label, 3)}</p>
      </div>
    {/each}
  {:else}
    <div class="tick-p">
      <div class="tick" style="background: black" />
      <p>{high ? high + '+' : ''}</p>
    </div>
    <div
      class="legend-bar"
      style="background: linear-gradient(to top, {linColorArr[0]}, {linColorArr[1]}, {linColorArr[2]}, {linColorArr[3]},
      {linColorArr[4]})" />
    <div class="tick-p">
      <div class="tick" style="background: black" />
      <p>{low}</p>
    </div>
  {/if}
</div>
