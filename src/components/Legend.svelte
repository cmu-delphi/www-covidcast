<script>
  import { DIRECTION_THEME, ENCODING_BUBBLE_THEME, ENCODING_SPIKE_THEME } from '../theme';
  import {
    signalType,
    stats,
    currentSensor,
    currentLevel,
    currentDataReadyOnMap,
    encoding,
    colorScale,
    bubbleRadiusScale,
    spikeHeightScale,
    currentSensorEntry,
  } from '../stores';
  import logspace from 'compute-logspace';
  import { isCountSignal } from '../data/signals';
  import { transparent, pairAdjacent } from '../util';

  let spikeBase = ENCODING_SPIKE_THEME.baseSize,
    size = 0,
    maxHeight,
    heightScale;

  let spikePadding = 5;

  let high = '',
    unit = '';
  let labels = [['0', '0']];

  currentSensor.subscribe((s) => ($stats ? update(s, $stats, $currentLevel) : ''));
  stats.subscribe((s) => (s ? update($currentSensor, s, $currentLevel) : ''));
  currentLevel.subscribe((l) => ($stats ? update($currentSensor, $stats, l) : ''));
  encoding.subscribe(() => ($stats ? update($currentSensor, $stats, $currentLevel) : ''));
  colorScale.subscribe(() => ($stats ? update($currentSensor, $stats, $currentLevel) : ''));
  bubbleRadiusScale.subscribe(() => ($stats ? update($currentSensor, $stats, $currentLevel) : ''));
  spikeHeightScale.subscribe(() => ($stats ? update($currentSensor, $stats, $currentLevel) : ''));

  function update(sens, stats, level) {
    // for signalType === 'direction', the legend is hardcoded.
    if ($signalType === 'direction') return;

    let sts;
    let valueMinMax;

    size = ENCODING_SPIKE_THEME.size[$currentLevel] * spikeBase;
    maxHeight = ENCODING_SPIKE_THEME.maxHeight[$currentLevel] * spikeBase;

    if (isCountSignal($currentSensor)) {
      sts = stats.get(sens + '_' + level);
      valueMinMax = [Math.max(0.14, sts.mean - 3 * sts.std), sts.mean + 3 * sts.std];

      high = getSigfigs(valueMinMax[1].toFixed(2), 3);

      labels = ['0'];
      let min = Math.log(valueMinMax[0]) / Math.log(10);
      let max = Math.log(valueMinMax[1]) / Math.log(10);
      let arr = logspace(min, max, 7);

      for (let i = 0; i < arr.length; i++) {
        arr[i] = parseFloat(arr[i]).toFixed(2);
        labels.push(arr[i]);
      }

      labels = pairAdjacent(labels);

      heightScale = $spikeHeightScale.clone().range([0, maxHeight]).domain(valueMinMax);
    } else {
      sts = stats.get(sens);
      valueMinMax = [sts.mean - 3 * sts.std, sts.mean + 3 * sts.std];
      if ($currentSensorEntry.format === 'raw') {
        high = getSigfigs(valueMinMax[1].toFixed(2), 3);
        unit = '';
        valueMinMax[0] = Math.max(0, valueMinMax[0]);
      } else {
        // otherwise, it's 'percent'.
        high = getSigfigs(Math.min(100, valueMinMax[1]).toFixed(2), 3);
        unit = '%';
        valueMinMax[0] = Math.max(0, valueMinMax[0]);
        valueMinMax[1] = Math.min(100, valueMinMax[1]);
      }

      let arr = splitDomain(valueMinMax[0], valueMinMax[1], 7);
      labels = [];
      for (let i = 0; i < arr.length; i++) {
        arr[i] = parseFloat(arr[i]).toFixed(2);
        labels.push(arr[i]);
      }
      labels = pairAdjacent(labels);
      heightScale = $spikeHeightScale.clone().range([0, maxHeight]).domain(valueMinMax);
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

  $: getSpikePath = (value) => {
    if (!heightScale) return '';
    return `M 0 ${heightScale(+value)} L ${size} 0 L ${size * 2} ${heightScale(+value)}`;
  };
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
    display: flex;
    justify-content: space-around;
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

  .trend-legend-grouping ul.legend-labels li div.color-block {
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
    align-items: center;
  }

  .bubble-legend li {
    display: flex;
    font-size: 80%;
    padding-right: 10px;
    align-items: center;
  }

  .spike-legend ul {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: space-around;
    align-items: baseline;
    list-style: none;
  }

  .spike-legend li {
    font-size: 80%;
    text-align: center;
  }

  .spike-legend svg {
    display: block;
    max-width: 200px;
    max-height: 200px;
  }

  .bubble {
    border: 1px solid #666;
    border-radius: 200px;
    display: inline-block;
    margin-right: 0.3rem;
    max-width: 200px;
    max-height: 200px;
  }

  .spike {
    stroke-width: 2px;
    stroke-linecap: round;
  }

  .loader-container {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .loader {
    border: 4px solid #f3f3f3;
    border-radius: 50%;
    border-top: 4px solid #c41230;
    width: 20px;
    height: 20px;
    -webkit-animation: spin 1s linear infinite; /* Safari */
    animation: spin 1s linear infinite;
  }

  /* Safari */
  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
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
          {isCountSignal($currentSensor) ? 'Count' : 'Intensity'}
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
          disabled={true}>
          7-day Trend
          <!-- {#if $currentSensorEntry.type === 'late' && $currentSensorEntry.id !== 'hospital-admissions'} -->
          {#if true}
            <span class="disabled-tooltip">Currently unavailable</span>
          {/if}
        </button>

      </div>
    </div>
  </div>
  {#if !$currentDataReadyOnMap}
    <div class="loader-container">
      <div class="loader" />
    </div>
  {:else if $signalType === 'direction'}
    <div class="trend-legend-grouping">
      <ul class="legend-labels">
        <li>
          <div class="color-block" style="background-color: {DIRECTION_THEME.increasing}" />
          {@html DIRECTION_THEME.increasingIcon}
          Increasing
        </li>
        <li>
          <div class="color-block" style="background-color: {DIRECTION_THEME.steady}" />
          {@html DIRECTION_THEME.steadyIcon}
          Steady
        </li>
        <li>
          <div class="color-block" style="background-color: {DIRECTION_THEME.decreasing}" />
          {@html DIRECTION_THEME.decreasingIcon}
          Decreasing
        </li>
      </ul>
    </div>
  {:else if $encoding === 'color'}
    {#if isCountSignal($currentSensor)}
      <div class="legend-grouping">
        <ul class="legend-labels">
          {#each labels as [label1, label2]}
            <li class="colored">
              <span
                class="colored"
                style="background: linear-gradient(to right, {$colorScale(+label1)}, {$colorScale(+label2)})" />
              {getSigfigs(label1, 3)}
            </li>
          {/each}
          <li class="ends">
            <span class="ends" style="background: rgba(255, 255, 255, 0.9);" />
            {high ? high + unit + '+' : ''}
          </li>
        </ul>
      </div>
    {:else}
      <div class="legend-grouping">
        <ul class="legend-labels">
          {#each labels as [label1, label2]}
            <li class="colored">
              <span
                class="colored"
                style="background: linear-gradient(to right, {$colorScale(+label1)}, {$colorScale(+label2)})" />
              {getSigfigs(label1, 3)}
            </li>
          {/each}
          <li class="ends">
            <span class="ends" style="background: rgba(255, 255, 255, 0.9);" />
            {high ? high + unit + '+' : ''}
          </li>
        </ul>
      </div>
    {/if}
  {:else if $encoding === 'bubble'}
    <div class="bubble-legend">
      <ul>
        {#each labels as [label], j}
          {#if +label > 0}
            <li class="colored">
              <div
                style="width: {$bubbleRadiusScale(+label) * 2}px; height: {$bubbleRadiusScale(+label) * 2}px;background:
                {transparent($colorScale(+label), ENCODING_BUBBLE_THEME.opacity)};border-color: {$colorScale(+label)}"
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
    </div>
  {:else if $encoding === 'spike'}
    <div class="spike-legend">
      <ul>
        {#each labels as [label]}
          {#if +label > 0}
            <li>
              <svg width={size * 2 + spikePadding * 2} height={heightScale(+label) + spikePadding * 2}>
                <g style="transform:translate({spikePadding}px, {spikePadding}px)">
                  <path
                    d={getSpikePath(+label)}
                    class="spike"
                    fill={transparent($colorScale(+label), ENCODING_SPIKE_THEME.fillOpacity)}
                    stroke={transparent($colorScale(+label), ENCODING_SPIKE_THEME.strokeOpacity)} />
                </g>
              </svg>
              <div>{getSigfigs(label, 3)}</div>
            </li>
          {/if}
        {/each}
        {#if high}
          <li>
            <svg width={size * 2 + spikePadding * 2} height={heightScale(+high) + spikePadding * 2}>
              <g style="transform:translate({spikePadding}px, {spikePadding}px)">
                <path
                  d={getSpikePath(+high)}
                  class="spike"
                  fill={transparent($colorScale(+high), ENCODING_SPIKE_THEME.fillOpacity)}
                  stroke={transparent($colorScale(+high), ENCODING_SPIKE_THEME.strokeOpacity)} />
              </g>
            </svg>
            <div>{high ? high + unit + '+' : ''}</div>
          </li>
        {/if}
      </ul>
    </div>
  {/if}
</div>
