<script>
  import { allSensorsGrouped } from '../../../stores/allSensors';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;

  /**
   * @type {""}
   */
  export let value = '';
</script>

<div>
  <label for="widget-adder-s" class="uk-form-label">Indicator</label>
  <select id="widget-adder-s" class="uk-select" name="sensor" {value}>
    <option value="">Use Configured ({sensor.name})</option>
    {#each allSensorsGrouped as group}
      <optgroup label={group.label}>
        {#each group.sensors as sensor}
          <option value={sensor.key}>{sensor.name}</option>
        {/each}
      </optgroup>
    {/each}
  </select>
</div>

<style>
  .uk-select optgroup {
    color: #444;
  }
</style>
