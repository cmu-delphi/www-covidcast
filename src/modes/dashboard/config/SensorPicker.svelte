<script>
  import { groupedSensorList } from '../../../stores';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;

  export let multiple = false;
</script>

<div>
  <label for="widget-adder-s" class="uk-form-label">Indicator</label>
  <select id="widget-adder-s" class="uk-select" name="sensor" {multiple}>
    <option value="">Default ({sensor.name})</option>
    {#each groupedSensorList as group}
      <optgroup label={group.label}>
        {#each group.sensors as sensor}
          <option value={sensor.key}>{sensor.name}</option>
        {/each}
      </optgroup>
    {/each}
  </select>
</div>
