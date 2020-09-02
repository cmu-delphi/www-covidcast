<script>
  import { ENCODING_SPIKE_THEME } from '../../theme';
  import {
    stats,
    currentLevel,
    colorScale,
    spikeHeightScale,
    currentSensorEntry,
    signalCasesOrDeathOptions,
    isMobileDevice,
    zoomMultiply,
  } from '../../stores';
  import { transparent } from '../../util';
  import { generateLabels } from '../MapBox/colors';

  const spikePadding = 2;

  export let loading = false;

  $: size = ENCODING_SPIKE_THEME.size[$currentLevel] * $zoomMultiply;
  $: maxHeight = ENCODING_SPIKE_THEME.maxHeight[$currentLevel] * $zoomMultiply;
  $: r = generateLabels(
    $stats,
    $currentSensorEntry,
    $currentLevel,
    $colorScale,
    $signalCasesOrDeathOptions,
    $isMobileDevice,
  );
  $: heightScale = $spikeHeightScale;
  $: maxPaddingHeight = maxHeight + spikePadding * 2;

  let getSpikePath = () => '';
  $: {
    const h = heightScale;
    const s = size;
    const m = $zoomMultiply;
    getSpikePath = (value) => `M 0 ${h(value) * m} L ${s} 0 L ${s * 2} ${h(value) * m}`;
  }
</script>

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
    justify-content: flex-end;
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

<ul class="legend-ticks" class:loading-bg={loading}>
  {#each r.labels as l}
    <li class="legend-direct-tick">
      <svg width={size * 2 + spikePadding * 2} height={heightScale(l.value) * $zoomMultiply + spikePadding * 2}>
        <g style="transform:translate({spikePadding}px, {spikePadding}px)">
          <path
            d={getSpikePath(l.value)}
            class="spike"
            fill={transparent(l.color, ENCODING_SPIKE_THEME.fillOpacity)}
            stroke={transparent(l.color, ENCODING_SPIKE_THEME.strokeOpacity)} />
        </g>
      </svg>
      <span>{l.label}</span>
    </li>
  {/each}
  <li class="legend-direct-tick">
    <svg width={size * 2 + spikePadding * 2} height={heightScale(r.highValue) * $zoomMultiply + spikePadding * 2}>
      <g style="transform:translate({spikePadding}px, {spikePadding}px)">
        <path
          d={getSpikePath(r.highValue)}
          class="spike"
          fill={transparent(r.highColor, ENCODING_SPIKE_THEME.fillOpacity)}
          stroke={transparent(r.highColor, ENCODING_SPIKE_THEME.strokeOpacity)} />
      </g>
    </svg>
    <span>{r.high}</span>
  </li>
</ul>
