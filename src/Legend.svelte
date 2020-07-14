<script>
  import { DIRECTION_THEME, ENCODING_BUBBLE_THEME } from './theme.js';
  import {
    signalType,
    stats,
    currentSensor,
    sensorMap,
    currentLevel,
    currentDataReadyOnMap,
    encoding,
    radiusScale,
  } from './stores.js';
  import * as d3 from 'd3';
  import logspace from 'compute-logspace';

  let high = '';
  let low = '';
  let colorScaleLog;

  $: logColorArr = [{ label: '0', from_color: DIRECTION_THEME.countMin, to_color: DIRECTION_THEME.countMin }];
  $: linColorArr = [];

  currentSensor.subscribe(s => ($stats ? update(s, $stats, $currentLevel, $encoding) : ''));
  stats.subscribe(s => (s ? update($currentSensor, s, $currentLevel, $encoding) : ''));
  currentLevel.subscribe(l => ($stats ? update($currentSensor, $stats, l, $encoding) : ''));
  encoding.subscribe(e => ($stats ? update($currentSensor, $stats, $currentLevel, e) : ''));
  radiusScale.subscribe(e => ($stats ? update($currentSensor, $stats, $currentLevel, $encoding) : ''));

  function update(sens, stats, level, encoding) {
    updateLowHigh(sens, stats, level, encoding);
  }

  function updateLowHigh(sens, stats, level) {
    let sts;
    let valueMinMax;

    if ($currentSensor.match(/num/)) {
      sts = stats.get(sens + '_' + level);
      valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];

      high = getSigfigs(valueMinMax[1].toFixed(2), 3);
      low = getSigfigs(Math.max(0, valueMinMax[0]).toFixed(2), 3);

      logColorArr = [{ label: '0', from_color: DIRECTION_THEME.countMin, to_color: DIRECTION_THEME.countMin }];
      let max = Math.log(valueMinMax[1]) / Math.log(10);
      let min = Math.log(Math.max(0.14, valueMinMax[0])) / Math.log(10);
      let arr = logspace(min, max, 7);

      colorScaleLog = d3
        .scaleSequentialLog(d3.interpolateYlOrRd)
        .domain([Math.max(0.14, valueMinMax[0]), valueMinMax[1]]);

      for (let i = 0; i < arr.length - 1; i++) {
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
        high = getSigfigs(valueMinMax[1].toFixed(2), 3);
        low = getSigfigs(Math.max(0, valueMinMax[0]).toFixed(2), 3);
        valueMinMax[0] = Math.max(0, valueMinMax[0]);
      } else {
        high = getSigfigs(Math.min(100, valueMinMax[1]).toFixed(2), 3) + '%';
        low = getSigfigs(Math.max(0, valueMinMax[0]).toFixed(2), 3) + '%';
        valueMinMax[0] = Math.max(0, valueMinMax[0]);
        valueMinMax[1] = Math.min(100, valueMinMax[1]);
      }
      const colorScaleLinear = d3.scaleSequential(d3.interpolateYlOrRd).domain([valueMinMax[0], valueMinMax[1]]);
      let arr = splitDomain(valueMinMax[0], valueMinMax[1], 7);
      linColorArr = [];
      for (let i = 0; i < arr.length - 1; i++) {
        arr[i] = parseFloat(arr[i]).toFixed(2);
        linColorArr.push({
          label: arr[i],
          from_color: colorScaleLinear(arr[i]),
          to_color: colorScaleLinear(arr[i + 1]),
        });
      }
    }
  }

  function getSigfigs(value, sigFigs) {
    return parseFloat(parseFloat(value).toPrecision(sigFigs));
  }

  function splitDomain(min, max, parts) {
    let splits = [min];
    const increment = (max - min) / parts;
    for (let i = 1; i < parts; i++) {
      splits.push(splits[i - 1] + increment);
    }
    splits.push(max);
    return splits;
  }

  function getBubbleFill(value) {
    let bubbleFill = d3.rgb(colorScaleLog(value));
    bubbleFill.opacity = 0.5;
    return bubbleFill.toString();
  }

  function getBubbleBorder(value) {
    return colorScaleLog(value);
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
    width: 110px;
    flex-grow: 1;
    margin: 0px;
    font-size: 1em;
    font-weight: 400;
    background-color: #fff;
    border-style: solid;
    border-color: #dbdbdb;
    border-width: 1px;
    border-radius: 4px;
    color: #666;
    cursor: pointer;
    justify-content: center;
    padding-bottom: calc(0.5em - 1px);
    padding-left: 0.5em;
    padding-right: 0.5em;
    padding-top: calc(0.5em - 1px);
    text-align: center;

    position: relative;
  }

  .buttons-group-side button.button:disabled {
    background-color: rgb(211, 211, 211);
    color: #666;
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
    background-color: #ececec;
    color: #111;
    font-weight: 600;

    border-color: transparent;
  }

  .buttons-group-side .button:hover {
    background-color: #dcdcdc;
    color: #111;
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
    /* if the option for the bubble encoding is visible for specific indicators (e.g., cases), the width of the legend can expand. So do not fix it to a certain number.*/
    /* width: 376px; */
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

  .bubble-legend ul {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: space-around;
  }

  .bubble-legend li {
    display: flex;
    font-size: 80%;
    align-items: center;
  }

  .bubble {
    border: 1px solid #666;
    border-radius: 200px;
    display: inline-block;
    margin-right: 0.3rem;
  }

  #encoding-options {
    display: flex;
  }

  #encoding-options > div {
    margin-right: 0.5rem;
  }

  .hidden {
    display: none;
  }
</style>

<div aria-label="legend" class="legend {$signalType === 'value' ? 'value' : ''}">
  <div id="encoding-options">
    <div class="toggle">
      <div aria-label="display type" class="buttons-group-side">
        <button
          aria-pressed={$signalType === 'value' ? 'true' : 'false'}
          class="button {$signalType === 'value' ? 'selected' : ''}"
          on:click={() => {
            if ($signalType !== 'value') {
              currentDataReadyOnMap.set(false);
              signalType.set('value');
            }
          }}>
          {$currentSensor.match(/num/) ? 'Count' : 'Intensity'}
        </button>
        <button
          aria-pressed={$signalType === 'direction' ? 'true' : 'false'}
          class="button {$signalType === 'direction' ? 'selected' : ''}"
          on:click={() => {
            if ($signalType !== 'direction') {
              currentDataReadyOnMap.set(false);
              signalType.set('direction');
            }
          }}
          disabled={$sensorMap.get($currentSensor).official ? true : false}>
          7-day Trend
          {#if $sensorMap.get($currentSensor).official}
            <span class="disabled-tooltip">Currently unavailable</span>
          {/if}
        </button>

      </div>
    </div>

    <div class="toggle {$signalType === 'direction' || !$currentSensor.match(/num/) ? 'hidden' : ''}">
      <div aria-label="encoding type" class="buttons-group-side">
        <button
          aria-pressed={$encoding === 'color' ? 'true' : 'false'}
          class="button {$encoding === 'color' ? 'selected' : ''}"
          on:click={() => {
            encoding.set('color');
          }}>
          Choropleth
        </button>
        <button
          aria-pressed={$encoding === 'bubble' ? 'true' : 'false'}
          class="button {$encoding === 'bubble' ? 'selected' : ''}"
          on:click={() => {
            encoding.set('bubble');
          }}>
          Bubbles
        </button>
      </div>
    </div>
  </div>
  {#if $encoding === 'color'}
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
              {getSigfigs(label, 3)}
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
              {getSigfigs(label, 3)}
            </li>
          {/each}
          <li class="ends">
            <span class="ends" style="background: rgba(255, 255, 255, 0.9);" />
            {high ? high + '+' : ''}
          </li>
        </ul>
      </div>
    {/if}
  {:else if $encoding === 'bubble'}
    <div class="bubble-legend">
      <ul>
        {#each [...logColorArr] as { label, from_color, to_color }, j}
          {#if +label > 0}
            <li class="colored">
              <div
                style="width: {$radiusScale(+label) * 2}px; height: {$radiusScale(+label) * 2}px;background: {getBubbleFill(+label)};border-color:
                {from_color}"
                class="bubble" />
              <div>{getSigfigs(label, 3)}</div>
            </li>
          {/if}
        {/each}
        {#if high}
          <li class="colored">
            <div
              style="width: {$radiusScale(+high) * 2}px; height: {$radiusScale(+high) * 2}px; background: {getBubbleFill(+high)};border-color:
              {getBubbleBorder(+high)}"
              class="bubble" />
            <div>{high ? high + '+' : ''}</div>
          </li>
        {/if}
      </ul>
    </div>
  {/if}
</div>
