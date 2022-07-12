<script>
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  import { getLevelInfo } from '../stores';

  /**
   * @type {import("../data/sensor").Sensor}
   */
  export let sensor;
  /**
   * @type {Date}
   */
  export let date;
  /**
   * @type {import("../data/regions").RegionLevel}
   */
  export let level;

  /**
   * @type {import("../data/trend").SensorTrend}
   */
  export let trend;
</script>

{#await trend then d}
  {#if d != null && (d.value == null || d.date < date)}
    <p>
      * the indicator "{sensor.name}" is not available for {formatDateYearDayOfWeekAbbr(date)} on the geographic level of
      {getLevelInfo(level).label}, yet. The data from {formatDateYearDayOfWeekAbbr(d.date)} is shown instead.
    </p>
  {/if}
{/await}
