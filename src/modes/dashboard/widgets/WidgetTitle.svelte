<script>
  import { formatDateYearWeekdayAbbr } from '../../../formats';
  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;

  export let region;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;

  export let unit = true;
</script>

<div>
  <h3>
    <slot>
      {sensor.name} in {typeof region === 'string' ? region : region.displayName} <br />
      on {formatDateYearWeekdayAbbr(date.value)}
    </slot>
  </h3>
  {#if unit}
    <h4>{sensor.unit}</h4>
  {/if}
</div>

<style>
  h3 {
    margin: 0;
    font-size: 1rem;
  }

  h4 {
    margin: 0;
    font-size: 0.75rem;
  }
</style>
