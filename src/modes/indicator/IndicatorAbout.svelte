<script>
  import { modeByID } from '..';
  import { currentMode } from '../../stores';
  import AboutSection from '../../components/AboutSection.svelte';

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
  <AboutSection>
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
            <a href={`../${modeByID.export.id}?sensor=${sensor.key}`} on:click|preventDefault={exportData}
              >Export Data</a
            >
          </li>
        </ul>
      {/if}
    </p>
  </AboutSection>
{/if}

<style>
  .desc {
    font-size: 0.875rem;
  }
</style>
