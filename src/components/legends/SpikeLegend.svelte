<script>
  import { ENCODING_SPIKE_THEME } from '../../theme';
  import {
    stats,
    currentLevel,
    colorScale,
    spikeHeightScale,
    currentSensorEntry,
    currentDataReadyOnMap,
  } from '../../stores';
  import { transparent } from '../../util';
  import { getSigfigs, generateLabels } from '../MapBox/colors';

  const spikeBase = ENCODING_SPIKE_THEME.baseSize;
  const spikePadding = 5;

  let size;
  let maxHeight;
  let heightScale;

  let high = '';
  let unit = '';
  let labels = [];

  $: {
    size = ENCODING_SPIKE_THEME.size[$currentLevel] * spikeBase;
    maxHeight = ENCODING_SPIKE_THEME.maxHeight[$currentLevel] * spikeBase;

    const r = generateLabels($stats, $currentSensorEntry, $currentLevel);
    labels = r.labels;
    high = r.high;
    unit = r.unit;
    heightScale = $spikeHeightScale.clone().range([0, maxHeight]).domain(r.valueMinMax);
  }

  function getSpikePath(value) {
    if (!heightScale) {
      return '';
    }
    return `M 0 ${heightScale(+value)} L ${size} 0 L ${size * 2} ${heightScale(+value)}`;
  }
</script>

<style>
  .spike-legend {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: space-around;
    align-items: baseline;
    list-style: none;
  }

  li {
    font-size: 80%;
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

<ul class="spike-legend" class:loading-bg={!$currentDataReadyOnMap}>
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
