<script>
  import { determineMinMax, determineColorScale } from '../../components/MapBox/colors';
  import { formatDateShortOrdinal } from '../../formats';
  import { stats } from '../../stores';
  import { primaryValue } from '../../stores/constants';
  import { MISSING_COLOR, ZERO_COLOR } from '../../theme';

  /**
   * @type {null | Promise<import("../../data").EpiDataRow[]>}
   */
  export let data;

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @type {string}
   */
  export let level;

  $: valueKey = primaryValue(sensor, {});

  function resolveColorScale(sensor, stats, level) {
    if (!stats) {
      return () => null;
    }
    const sensorType = sensor.getType({});
    const valueMinMax = determineMinMax(stats, sensor, level, {});
    const { scale } = determineColorScale(valueMinMax, sensor, sensorType);
    return (v) => {
      return v == null ? null : v === 0 ? ZERO_COLOR : scale(v);
    };
  }
  $: colorScale = resolveColorScale(sensor, $stats, level);

  let loading = true;

  $: {
    loading = true;
    if (data) {
      data.then(() => {
        loading = false;
      });
    }
  }

  /**
   * @param {import("../../data").EpiDataRow} row
   */
  function tooltip(row, valueKey) {
    return `${sensor.formatValue(row[valueKey])} (${formatDateShortOrdinal(row.date_value)})`;
  }
</script>

<style>
  .heatmap-1d {
    display: flex;
    height: 1.2em;
  }
  .cell {
    flex: 1 1 0;
  }
</style>

<div class="heatmap-1d" class:loading style="background: repeating-linear-gradient(-45deg, {MISSING_COLOR}, white 10%)">
  {#await data then rows}
    {#each rows as row}
      <div class="cell" style="background: {colorScale(row[valueKey])}" title={tooltip(row, valueKey)} />
    {/each}
  {/await}
</div>
