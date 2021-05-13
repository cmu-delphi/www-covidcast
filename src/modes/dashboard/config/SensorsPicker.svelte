<script>
  import { sensorTypes } from '../../../data/sensor';

  import { metaDataManager } from '../../../stores';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;

  /**
   * @type {string[]}
   */
  export let value;

  $: initialValue = value ? (Array.isArray(value) ? value : [value]) : [''];
</script>

<div>
  <label for="widget-adder-s" class="uk-form-label">Indicators</label>
  <select id="widget-adder-s" class="uk-select" name="sensors" value={initialValue} multiple size={10}>
    <option value="">Use Configured ({sensor.name}, Cases, Deaths)</option>
    {#each sensorTypes as group}
      <optgroup label={group.label}>
        {#each $metaDataManager.getSensorsOfType(group.id) as sensor}
          <option value={sensor.key}>{sensor.name}</option>
        {/each}
      </optgroup>
    {/each}
  </select>
</div>
