<script>
  import { formatDateYearDayOfWeekAbbr } from '../formats';

  /**
   * @type {import('../stores/params').SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let date;

  const currDate = new Date();

  function datesEqual(date) {
    return date.value == currDate;
  }
</script>

{#if !datesEqual(date)}
  <div data-uk-alert class="uk-alert-warning">
    The indicator "{sensor.name}" is not available for {formatDateYearDayOfWeekAbbr(currDate)}, yet. The latest known
    data is available on {formatDateYearDayOfWeekAbbr(date.value)}.
  </div>
{/if}
