<script>
  import FancyHeader from './FancyHeader.svelte';
  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;
</script>

<style>
  .desc {
    font-size: 0.875rem;
  }
</style>

{#if sensor.value.description}
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <FancyHeader normal>About this indicator</FancyHeader>

      <div class="desc">
        {@html sensor.value.description}

        <p>Source: {sensor.dataSource}</p>
      </div>
    </div>
  </div>
{/if}
