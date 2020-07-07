<script>
  import { signalType, stats, currentSensor, sensorMap, currentLevel, encoding } from './stores.js';
  import { DIRECTION_THEME, ENCODING_BUBBLE_THEME } from './theme.js';
  import * as d3 from 'd3';
  import logspace from 'compute-logspace';
  import { getNiceNumber } from './util.js';

  let high = '';
  let low = '';
  let bubbleLegend = [];
  $: logColorArr = [{ label: '0', from_color: DIRECTION_THEME.countMin, to_color: DIRECTION_THEME.countMin }];
  $: linColorArr = [];

  currentSensor.subscribe(s => ($stats ? update(s, $stats, $currentLevel, $encoding) : ''));
  stats.subscribe(s => (s ? update($currentSensor, s, $currentLevel, $encoding) : ''));
  currentLevel.subscribe(l => ($stats ? update($currentSensor, $stats, l, $encoding) : ''));
  encoding.subscribe(e => ($stats ? update($currentSensor, $stats, $currentLevel, e) : ''));

  function update(sens, stats, level, encoding) {
    if (encoding == 'color') {
      updateLowHigh(sens, stats, level, encoding);
      return;
    }

    let sts, valueMax;
    if ($currentSensor.match(/num/)) {
      sts = stats.get(sens + '_' + level);
    } else {
      sts = stats.get(sens);
    }
    valueMax = getNiceNumber(sts.mean + 3 * sts.std);

    let coef =
      ENCODING_BUBBLE_THEME.maxRadius[$currentLevel] /
      ((Math.log(valueMax) + 0.001) / Math.log(ENCODING_BUBBLE_THEME.base));

    let scale = x => (coef * Math.log(x + 0.001)) / Math.log(ENCODING_BUBBLE_THEME.base);
    let revert = x => Math.pow(Math.E, (x * Math.log(ENCODING_BUBBLE_THEME.base)) / coef) - 0.001;

    bubbleLegend = d3.range(6).map(i => {
      let targetRadius = (ENCODING_BUBBLE_THEME.maxRadius[$currentLevel] / 6) * (6 - i);
      let candidateX = revert(targetRadius);
      let x = getNiceNumber(candidateX);

      return [scale(x), x];
    });

    // remove duplicates
    let last;
    bubbleLegend = bubbleLegend.filter(b => {
      if (last === b[0]) return false;
      last = b[0];
      return true;
    });
  }

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
        valueMinMax[0] = Math.max(0, valueMinMax[0]);
        valueMinMax[1] = Math.min(100, valueMinMax[1]);
      }
      const colorScaleLinear = d3.scaleSequential(d3.interpolateYlOrRd).domain([valueMinMax[0], valueMinMax[1]]);
      var arr = split_domain(valueMinMax[0], valueMinMax[1], 7);
      linColorArr = [];
      for (var i = 0; i < arr.length - 1; i++) {
        arr[i] = parseFloat(arr[i]).toFixed(2);
        linColorArr.unshift({
          label: arr[i],
          from_color: colorScaleLinear(arr[i]),
          to_color: colorScaleLinear(arr[i + 1]),
        });
      }
    }
  }

  function sig_figs(value, sigFigs) {
    return parseFloat(parseFloat(value).toPrecision(sigFigs));
  }

  function split_domain(min, max, parts) {
    let split_arr = [min];
    const increment = (max - min) / parts;
    for (var i = 1; i < parts; i++) {
      split_arr.push(split_arr[i - 1] + increment);
    }
    split_arr.push(max);
    return split_arr;
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

  .bubble {
    border: 1px solid #666;
    border-radius: 200px;
    display: inline-block;
  }
</style>

<div aria-label="legend" class="legend {$signalType === 'value' ? 'value' : ''}">
  {#if $encoding === 'color'}
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
      {#each linColorArr as { label, from_color, to_color }, j}
        <div class="count-p">
          <div class="color inc" style="background: linear-gradient(to top, {from_color}, {to_color})" />
        </div>
        <div class="tick-p">
          <div class="tick" style="background: black" />
          <p>{sig_figs(label, 3)}</p>
        </div>
      {/each}
    {/if}
  {:else if $encoding === 'bubble'}
    {#each bubbleLegend as [r, value]}
      <div>
        <div style="width: {r * 2}px; height: {r * 2}px; margin-top: .5rem" class="bubble" />
      </div>
      {value.toLocaleString('en')}
    {/each}
  {/if}
</div>
