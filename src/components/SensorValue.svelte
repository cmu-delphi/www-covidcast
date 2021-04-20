<script>
  import SensorUnit from './SensorUnit.svelte';
  /**
   * @type {import("../stores/params").SensorParam}
   */
  export let sensor;
  export let value = null;
  export let enforceSign = false;
  export let long = false;
  export let medium = false;
</script>

{#if value == null || Number.isNaN(value)}
  N/A
{:else}
  {sensor.formatValue(value, enforceSign)}
  <SensorUnit {sensor} {long} {medium} />
{/if}

<style>
</style>
