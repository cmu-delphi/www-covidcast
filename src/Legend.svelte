<script>
  import { signalType, stats, currentSensor, sensorMap, currentLevel, currentDataReadyOnMap } from './stores.js';
  import { DIRECTION_THEME } from './theme.js';
  import * as d3 from 'd3';
  import logspace from 'compute-logspace';

  let high = '';
  let low = '';
  $: logColorArr = [{ label: '0', from_color: DIRECTION_THEME.countMin, to_color: DIRECTION_THEME.countMin }];
  $: linColorArr = [];

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
        logColorArr.push({
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
        high = sig_figs(Math.min(100, valueMinMax[1]).toFixed(2), 3) + '%';
        low = sig_figs(Math.max(0, valueMinMax[0]).toFixed(2), 3) + '%';
        valueMinMax[0] = Math.max(0, valueMinMax[0]);
        valueMinMax[1] = Math.min(100, valueMinMax[1]);
      }
      const colorScaleLinear = d3.scaleSequential(d3.interpolateYlOrRd).domain([valueMinMax[0], valueMinMax[1]]);
      var arr = split_domain(valueMinMax[0], valueMinMax[1], 7);
      linColorArr = [];
      for (var i = 0; i < arr.length - 1; i++) {
        arr[i] = parseFloat(arr[i]).toFixed(2);
        linColorArr.push({
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
  .toggle {
    width: 230px;
    padding-bottom: 15px;
  }
  .buttons-group button.button .disabled-tooltip {
    visibility: hidden;
    width: 80px;
    border-style: solid;
    border-width: 1px;
    border-color: #666;
    background-color: #fff;
    color: #333;
    font-weight: 400;
    font-size: 0.95em;
    line-height: 1.2em;
    text-align: center;
    border-radius: 6px;
    padding: 5px 5px;
    position: absolute;
    z-index: 1;
    top: -5px;
    left: 105%;
  }

  .buttons-group button.button .disabled-tooltip::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent #666 transparent transparent;
  }

  .buttons-group button.button:hover .disabled-tooltip {
    visibility: visible;
  }

  .buttons-group-side {
    width: 100%;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
  }

  .buttons-group-side button.button {
    flex-grow: 1;
    margin: 0px;
    font-size: 1em;
    font-weight: 400;
    background-color: #fff;
    border-style: solid;
    border-color: #dbdbdb;
    border-width: 1px;
    color: #666666;
    cursor: pointer;
    justify-content: center;
    padding-bottom: calc(0.5em - 1px);
    padding-left: 1em;
    padding-right: 1em;
    padding-top: calc(0.5em - 1px);
    text-align: center;

    position: relative;

    border-radius: 4px;
  }

  .buttons-group-side button.button:disabled {
    background-color: rgb(211, 211, 211);
    color: #666666;
    cursor: not-allowed;
  }

  .buttons-group-side .button:first-child {
    margin-right: 4px;
  }

  .buttons-group-side button.button .disabled-tooltip {
    visibility: hidden;
    width: 80px;
    border-style: solid;
    border-width: 1px;
    border-color: #666;
    background-color: #fff;
    color: #333;
    font-size: 0.95em;
    line-height: 1.2em;
    font-weight: 400;
    text-align: center;
    border-radius: 6px;
    padding: 5px 5px;
    position: absolute;
    z-index: 1;
    top: 150%;
    left: 50%;
    margin-left: -50px;
  }

  .buttons-group-side button.button .disabled-tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent #666 transparent;
  }
  .buttons-group-side button.button:hover .disabled-tooltip {
    visibility: visible;
  }

  .buttons-group-side .button.selected {
    background-color: #767676;
    color: #fff;
    font-weight: 600;

    border: none;
  }

  .buttons-group-side .button:hover {
    background-color: #666666;
    color: #fff;
  }

  .buttons-group-side .button:focus,
  .buttons-group-side .button:active {
    outline: none;
  }

  .legend {
    font-size: 0.8rem;
    /* border-radius: 8px; */
    padding: 15px 15px;
    box-sizing: border-box;

    transition: all 0.1s ease-in;

    height: 100%;
    width: 376px;
    flex-direction: column;
  }

  .legend.value {
    display: flex;
    flex-direction: column;
    justify-content: left;
  }

  .legend-grouping ul,
  .trend-legend-grouping ul {
    margin: 0;
    padding: 0;
    float: left;
    list-style: none;
  }
  .trend-legend-grouping ul li {
    display: block;
    float: left;
    width: 110px;
    margin-bottom: 6px;
    margin-left: 0px;
    padding-top: 0px;
    text-align: center;
    font-size: 80%;
    list-style: none;
  }

  .trend-legend-grouping ul.legend-labels li span {
    display: block;
    float: left;
    height: 15px;
    width: 110px;
  }

  .legend-grouping ul li.colored {
    display: block;
    float: left;
    width: 43px;
    margin-bottom: 6px;
    margin-right: 1px;
    margin-left: 0px;
    padding-top: 0px;
    text-align: left;
    font-size: 80%;
    list-style: none;
  }

  .legend-grouping ul.legend-labels li span.colored {
    display: block;
    float: left;
    height: 15px;
    width: 43px;
  }

  .legend-grouping ul li.ends {
    display: block;
    float: left;
    width: 37px;
    margin-bottom: 6px;
    margin-right: 1px;
    margin-left: 0px;
    padding-top: 0px;
    text-align: left;
    font-size: 80%;
    list-style: none;
  }

  .legend-grouping ul.legend-labels li span.ends {
    display: block;
    float: left;
    height: 15px;
    width: 37px;
  }
</style>

<div aria-label="legend" class="legend {$signalType === 'value' ? 'value' : ''}">

  <div class="toggle">
    <div aria-label="display type" class="buttons-group-side">
      <button
        aria-pressed={$signalType === 'value' ? 'true' : 'false'}
        class="button {$signalType === 'value' ? 'selected' : ''}"
        on:click={() => {
          currentDataReadyOnMap.set(false);
          signalType.set('value');
        }}>
        {$currentSensor.match(/num/) ? 'Count' : 'Intensity'}
      </button>
      <button
        aria-pressed={$signalType === 'direction' ? 'true' : 'false'}
        class="button {$signalType === 'direction' ? 'selected' : ''}"
        on:click={() => {
          currentDataReadyOnMap.set(false);
          signalType.set('direction');
        }}
        disabled={$sensorMap.get($currentSensor).official ? true : false}>
        7-day Trend
        {#if $sensorMap.get($currentSensor).official}
          <span class="disabled-tooltip">Currently unavailable</span>
        {/if}
      </button>

    </div>
  </div>

  {#if $signalType === 'direction'}
    <div class="trend-legend-grouping">
      <ul class="legend-labels">
        <li>
          <span style="background-color: {DIRECTION_THEME.increasing}" />
          {@html DIRECTION_THEME.increasingIcon}
          Increasing
        </li>
        <li>
          <span style="background-color: {DIRECTION_THEME.steady}" />
          {@html DIRECTION_THEME.steadyIcon}
          Steady
        </li>
        <li>
          <span style="background-color: {DIRECTION_THEME.decreasing}" />
          {@html DIRECTION_THEME.decreasingIcon}
          Decreasing
        </li>
      </ul>
    </div>
  {:else if $currentSensor.match(/num/)}
    <div class="legend-grouping">
      <ul class="legend-labels">
        {#each logColorArr as { label, from_color, to_color }, j}
          <li class="colored">
            <span class="colored" style="background: linear-gradient(to right, {from_color}, {to_color})" />
            {sig_figs(label, 3)}
          </li>
        {/each}
        <li class="ends">
          <span class="ends" style="background: rgba(255, 255, 255, 0.9);" />
          {high ? high + '+' : ''}
        </li>
      </ul>

    </div>
  {:else}
    <div class="legend-grouping">
      <ul class="legend-labels">
        {#each linColorArr as { label, from_color, to_color }, j}
          <li class="colored">
            <span class="colored" style="background: linear-gradient(to right, {from_color}, {to_color})" />
            {sig_figs(label, 3)}
          </li>
        {/each}
        <li class="ends">
          <span class="ends" style="background: rgba(255, 255, 255, 0.9);" />
          {high ? high + '+' : ''}
        </li>
      </ul>

    </div>
  {/if}
</div>
