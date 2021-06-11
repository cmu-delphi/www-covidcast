<script>
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  import { getLevelInfo } from '../stores';

  /**
   * @type {import('../stores/params').SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../stores/params").RegionParam}
   */
  export let region;
</script>

{#if !sensor.value.levels.includes(region.level)}
  <div data-uk-alert class="uk-alert-warning">
    The indicator "{sensor.name}" does not support the geographic level: {getLevelInfo(region.level).labelPlural}.
  </div>
{:else if date.sensorTimeFrame.max < date.value}
  <div data-uk-alert class="uk-alert-warning">
    The indicator "{sensor.name}" is not available for {formatDateYearDayOfWeekAbbr(date.value)}, yet.
  </div>
{/if}
