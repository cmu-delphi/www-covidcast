<script>
  import SensorSearch from '../../../components/SensorSearch.svelte';
  import { metaDataManager } from '../../../stores';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;

  /**
   * @type {string[]}
   */
  export let value;

  let syncedValues = value ? (Array.isArray(value) ? value : [value]) : [''];

  $: defaultSensor = {
    key: '',
    id: '',
    signal: '',
    name: `Use Configured: ${sensor.name}, Cases, Deaths`,
  };
  $: allItems = [defaultSensor, ...$metaDataManager.metaSensors];

  $: selectedItems = syncedValues.map((d) => (!d ? defaultSensor : $metaDataManager.getSensor(d)));
</script>

<div>
  <label for="widget-adder-s" class="uk-form-label">Indicators</label>
  {#each syncedValues as s}
    <input type="hidden" value={s} name="sensors" />
  {/each}
  <SensorSearch
    items={allItems}
    {selectedItems}
    on:change={(e) => {
      syncedValues = e.detail ? [e.detail.key] : [''];
    }}
    on:add={(e) => {
      syncedValues = [...syncedValues, e.detail.key];
    }}
  />
</div>
