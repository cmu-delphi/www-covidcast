<script>
  import SensorUnit from './SensorUnit.svelte';
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  export let value = null;
  export let enforceSign = false;
</script>

{#if value == null || Number.isNaN(value)}
  N/A
{:else}
  {sensor.formatValue(value, enforceSign)}
  <SensorUnit {sensor} />
{/if}

<style>
</style>
