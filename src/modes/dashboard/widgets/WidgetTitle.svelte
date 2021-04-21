<script>
  import { formatDateLocal, formatDateYearWeekdayAbbr } from '../../../formats';
  import { TimeFrame } from '../../../stores/params';
  /**
   * @type {import("../../../stores/params").SensorParam | string}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").RegionParam | string}
   */
  export let region;
  /**
   * @type {import("../../../stores/params").DateParam | import("../../../stores/params").TimeFrame}
   */
  export let date;

  export let unit = true;
</script>

<div class="widget-title">
  <h3>
    <slot>
      {typeof sensor === 'string' ? sensor : sensor.name} in {typeof region === 'string' ? region : region.displayName}
      <br />
      {date instanceof TimeFrame
        ? `between ${formatDateLocal(date.min)} and ${formatDateLocal(date.max)}`
        : `on ${formatDateYearWeekdayAbbr(date.value)}`}
    </slot>
  </h3>
  {#if unit && typeof sensor !== 'string'}
    <h4>{sensor.unit}</h4>
  {/if}
  <slot name="addons" />
</div>

<style>
  .widget-title {
    position: relative;
  }

  .widget-title > h3 {
    margin: 0;
    font-size: 1rem;
  }

  .widget-title > h4 {
    margin: 0;
    font-size: 0.75rem;
  }
</style>
