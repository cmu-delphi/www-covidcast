<script>
  import SensorSearch from '../../../components/SensorSearch.svelte';
  import { metaDataManager } from '../../../stores';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;

  export let value = '';

  let syncedValue = value || '';

  $: defaultSensor = {
    key: '',
    id: '',
    signal: '',
    name: `Use Configured: ${sensor.name}`,
  };
  $: allItems = [defaultSensor, ...$metaDataManager.metaSensors];
</script>

<div>
  <label for="widget-adder-s" class="uk-form-label">Indicator</label>
  <input type="hidden" value={syncedValue} name="sensor" />
  <SensorSearch
    items={allItems}
    selectedItem={value ? $metaDataManager.getSensor(value) : defaultSensor}
    on:change={(e) => {
      syncedValue = e.detail.key || '';
    }}
  />
</div>
