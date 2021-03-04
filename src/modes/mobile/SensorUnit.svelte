<script>
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  export let long = false;
  export let force = false;
</script>

{#if long && sensor.isPercentage}
  % of pop.
{:else if long && sensor.isPer100K}
  per 100,000 people
{:else if sensor.isPer100K}<span class="per100k"><span>PER</span><span>100K</span></span>{:else if force}%{/if}
