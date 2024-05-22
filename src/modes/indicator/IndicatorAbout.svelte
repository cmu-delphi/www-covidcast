<script>
  import { modeByID } from '..';
  import { formatDateISO } from '../../formats';
  import { currentMode } from '../../stores';
  import AboutSection from '../../components/AboutSection.svelte';

  /**
   * @type {import("../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../stores/params").SensorParam}
   */
  export let sensor;

  function setExportMode() {
    // switch to export mode
    currentMode.set(modeByID.export);
  }

  let exportURL = '';
  $: {
    exportURL = '';
    if (sensor && sensor.key.split('-').length >= 2) {
      // Given a sensor key formatted "sensor-name-here-signal_name_here", split on the last dash
      let [last, ...rest] = sensor.key.split('-').reverse();
      rest = rest.reverse().join('-');
      exportURL += `data_source=${rest}&signal=${last}`;

      if (region) {
        exportURL += `&geo_type=${region.level}&geo_value=${region.propertyId}`;
      }
      if (date) {
        exportURL += `&start_day=${formatDateISO(date.value)}&end_day=${formatDateISO(date.value)}`;
      }
    }
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
            <a href={`../export/?${exportURL}`} on:click={setExportMode}>Export Data</a>
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
