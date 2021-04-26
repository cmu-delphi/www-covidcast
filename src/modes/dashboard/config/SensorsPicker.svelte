<script>
  import { allSensorsGrouped } from '../../../stores/allSensors';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;

  /**
   * @type {string[]}
   */
  export let value;

  // TODO selected
</script>

<div>
  <label for="widget-adder-s" class="uk-form-label">Indicators</label>
  <select id="widget-adder-s" class="uk-select" name="sensors" multiple size={10}>
    <option value="" selected={!value}>Default ({sensor.name}, Cases, Deaths)</option>
    {#each allSensorsGrouped as group}
      <optgroup label={group.label}>
        {#each group.sensors as sensor}
          <option value={sensor.key} selected={value && (value === sensor.key || value.includes(sensor.key))}
            >{sensor.name}</option
          >
        {/each}
      </optgroup>
    {/each}
  </select>
</div>
