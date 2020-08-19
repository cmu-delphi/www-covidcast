<script>
  import { ENCODING_SPIKE_THEME } from '../../theme';
  import {
    stats,
    currentLevel,
    colorScale,
    spikeHeightScale,
    currentSensorEntry,
    signalCasesOrDeathOptions,
  } from '../../stores';
  import { transparent } from '../../util';
  import { generateLabels } from '../MapBox/colors';

  const spikeBase = ENCODING_SPIKE_THEME.baseSize;
  const spikePadding = 5;

  export let loading = false;

  $: size = ENCODING_SPIKE_THEME.size[$currentLevel] * spikeBase;
  $: maxHeight = ENCODING_SPIKE_THEME.maxHeight[$currentLevel] * spikeBase;
  $: r = generateLabels($stats, $currentSensorEntry, $currentLevel, $colorScale, $signalCasesOrDeathOptions);
  $: heightScale = $spikeHeightScale.clone().range([0, maxHeight]).domain(r.valueMinMax);
  $: maxPaddingHeight = maxHeight + spikePadding * 2;

  function getSpikePath(value) {
    if (!heightScale) {
      return '';
    }
    return `M 0 ${heightScale(value)} L ${size} 0 L ${size * 2} ${heightScale(value)}`;
  }
</script>

<style>
  ul {
    margin: 0;
    padding: 0;
    display: flex;
    font-size: 80%;
  }

  li {
    margin: 0;
    padding: 0;
    list-style: none;
    flex: 2 2 0;
    min-width: 5em;
    margin-bottom: 1em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    position: relative;
  }

  li.tick::after {
    content: attr(title);
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    text-align: center;
  }

  svg {
    display: block;
    max-width: 200px;
    max-height: 200px;
  }

  .spike {
    stroke-width: 2px;
    stroke-linecap: round;
  }
</style>

<ul class:loading-bg={loading}>
  {#each r.labels as l}
    <li class="tick" title={l.label} style="height: {maxPaddingHeight}px">
      <svg width={size * 2 + spikePadding * 2} height={heightScale(l.value) + spikePadding * 2}>
        <g style="transform:translate({spikePadding}px, {spikePadding}px)">
          <path
            d={getSpikePath(l.value)}
            class="spike"
            fill={transparent(l.color, ENCODING_SPIKE_THEME.fillOpacity)}
            stroke={transparent(l.color, ENCODING_SPIKE_THEME.strokeOpacity)} />
        </g>
      </svg>
    </li>
  {/each}
  <li class="tick" title={r.high} style="height: {maxPaddingHeight}px">
    <svg width={size * 2 + spikePadding * 2} height={heightScale(r.highValue) + spikePadding * 2}>
      <g style="transform:translate({spikePadding}px, {spikePadding}px)">
        <path
          d={getSpikePath(r.highValue)}
          class="spike"
          fill={transparent(r.highColor, ENCODING_SPIKE_THEME.fillOpacity)}
          stroke={transparent(r.highColor, ENCODING_SPIKE_THEME.strokeOpacity)} />
      </g>
    </svg>
  </li>
</ul>
