<script>
  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;
</script>

{#if sensor.value.description}
  <div class="uk-container content-grid">
    <div class="grid-3-11 mobile-invert">
      <h3 class="mobile-h3">About this indicator</h3>

      <div class="desc">
        {@html sensor.value.description}
      </div>
      <p class="desc">Source: {sensor.dataSource}</p>
    </div>
  </div>
{/if}

<style>
  .desc {
    font-size: 0.875rem;
  }

  .mobile-invert {
    background: #f0f1f3;
    border-radius: 3px;
    padding: 1.5rem;
  }
</style>
