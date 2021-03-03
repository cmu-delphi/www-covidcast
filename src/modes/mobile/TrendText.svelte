<script>
  import SensorValue from './SensorValue.svelte';
  /**
   * @type {import("../../stores/params").Trend}
   */
  export let trend;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
</script>

{#if !trend || trend.isUnknown}
  ?
{:else if trend.isBetter}
  better by
  <SensorValue {sensor} value={trend.delta} />
{:else if trend.isWorse}
  worse by
  <SensorValue {sensor} value={trend.delta} />
{:else}
  around the same with
  <SensorValue {sensor} value={trend.delta} />
{/if}
