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
   * @type {import("../data/trend").SensorTrend }
   */
  export let trend;

  /**
   * two way binding
   */
  export let suffix = '';

  export let prefix = '*';

  $: showWarning = trend.then((d) => {
    if (
      (d != null && (d.value == null || (d.date != null && d.date < date))) ||
      (d.date_value != null && d.date_value < date)
    ) {
      suffix = '*';
      return d;
    }
    suffix = '';
    return null;
  });
</script>

{#await showWarning then d}
  {#if d != null}
    <p>
      {prefix} the indicator "{sensor.name}" is not available for {formatDateYearDayOfWeekAbbr(date)} on the geographic level
      "{getLevelInfo(level).label}", yet. The data from {formatDateYearDayOfWeekAbbr(d.date ?? d.date_value)} is shown instead.
    </p>
  {/if}
{/await}
