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

  export let id;
  export let config = {};

  $: type = id.split('_')[0];

  function triggerEdit(event) {
    const formData = new FormData(event.currentTarget);
    const config = formToConfig(formData);
    dispatch('edit', {
      id,
      config,
    });
  }
</script>

<form class="widget-adder uk-form-stacked" on:submit|preventDefault={triggerEdit}>
  <WidgetPicker value={type} readonly />
  <hr />
  <WidgetConfigurator {sensor} {region} {date} {type} {config} />
  <hr />
  <button type="submit" class="uk-button uk-button-primary"> Update Widget </button>
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
