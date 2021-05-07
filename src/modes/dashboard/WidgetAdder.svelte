<script>
  import { createEventDispatcher } from 'svelte';
  import WidgetPicker from './config/WidgetPicker.svelte';
  import { formToConfig } from './utils';
  import WidgetConfigurator from './WidgetConfigurator.svelte';

  const dispatch = createEventDispatcher();

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  export let nextId = 0;

  let value = 'line';

  function triggerAdd(event) {
    const formData = new FormData(event.currentTarget);
    const config = formToConfig(formData);
    const type = formData.get('type');
    dispatch('add', {
      id: `${type}_${nextId}`,
      type,
      config,
    });
    value = 'line';
  }
</script>

<form class="widget-adder uk-form-stacked" on:submit|preventDefault={triggerAdd}>
  <WidgetPicker bind:value />
  <hr />
  <WidgetConfigurator {sensor} {region} {date} type={value} />
  <hr />
  <button type="submit" class="uk-button uk-button-primary"> Add Widget </button>
</form>

<style>
  .widget-adder {
    display: flex;
    flex-direction: column;
  }
  .widget-adder > :global(div) {
    margin: 1em 0;
  }
</style>
