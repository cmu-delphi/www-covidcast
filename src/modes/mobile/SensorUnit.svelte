<script>
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  export let long = false;
  export let medium = false;
</script>

{#if long}
  {sensor.unit}
{:else if medium}
  {sensor.unitShort}
{:else}
  {@html sensor.unitHTML}
{/if}
