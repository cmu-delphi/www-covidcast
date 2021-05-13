<script>
  import { sensorTypes } from '../../../data/sensor';

  import { metaDataManager } from '../../../stores';

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
    {#each sensorTypes as group}
      <optgroup label={group.label}>
        {#each $metaDataManager.getSensorsOfType(group.id) as sensor}
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
