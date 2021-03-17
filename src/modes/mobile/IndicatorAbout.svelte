<script>
  import { modeByID } from '..';
  import { currentMode } from '../../stores';
  /**
   * @type {import('../../stores/params').SensorParam}
   */
  export let sensor;

  function exportData() {
    sensor.set(sensor.value);
    // switch to export mode
    currentMode.set(modeByID.export);
  }
</script>

{#if sensor.value.description}
  <div class="uk-container content-grid">
    <div class="grid-3-11 mobile-invert">
      <h3 class="mobile-h3">About {sensor.name}</h3>

      <div class="desc">
        {@html sensor.value.description}
      </div>
      <p class="desc">Source: {sensor.value.dataSourceName}</p>
      <p class="desc uk-margin-remove-bottom">
        More information
        {#if sensor.value.links}
          <ul class="uk-margin-remove">
            {#each sensor.value.links as link}
              <li>
                {@html link}
              </li>
            {/each}
            <li>
              <a href={`?mode=${modeByID.export.id}&sensor=${sensor.key}`} on:click|preventDefault={exportData}
                >Export Data</a
              >
            </li>
          </ul>
        {/if}
      </p>
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
