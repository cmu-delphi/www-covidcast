<script>
  import lessThanIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/less-than.svg';
  import greaterThanIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/greater-than.svg';
  import { determineMinMax, determineColorScale, generateLabels } from '../../components/MapBox/colors';
  import { stats } from '../../stores';

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @type {string}
   */
  export let level;

  function resolveLabels(sensor, stats, level) {
    if (!stats) {
      return () => null;
    }
    const sensorType = sensor.getType({});
    const valueMinMax = determineMinMax(stats, sensor, level, {});
    const { scale } = determineColorScale(valueMinMax, sensor, sensorType);
    return generateLabels(stats, sensor, level, scale, {}).labels;
  }

  $: labels = resolveLabels(sensor, $stats, level);
</script>

<style>
  .cell {
    flex: 1 1 0;
  }
  .heatmap-legend {
    display: flex;
    min-width: 100px;
    height: 1.2em;
  }

  .legend-hint {
    display: flex;
    justify-content: space-between;
    font-size: 0.625rem;
    line-height: 0.875rem;
    white-space: nowrap;
    margin: 6px 0;
  }
  .inline-svg-icon {
    font-size: 0.5rem;
  }
</style>

<div>
  <div class="legend-hint">
    <div>
      <span class="inline-svg-icon">
        {@html lessThanIcon}
      </span>
      LESS
    </div>
    <div>
      MORE
      <span class="inline-svg-icon">
        {@html greaterThanIcon}
      </span>
    </div>
  </div>
  <div class="heatmap-legend">
    {#each labels as l}
      <div class="cell" style="background-color: {l.color}" title={l.label} />
    {/each}
  </div>
</div>
