<script>
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  export let long = false;
</script>

{#if long}
  {sensor.unit}
{:else}
  {@html sensor.unitHTML}
{/if}
