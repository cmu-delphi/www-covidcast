<script>
  import { createEventDispatcher } from 'svelte';
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
    const config = Object.create(null);
    formData.forEach((value, key) => {
      if (key.startsWith('_') || value === '' || key === 'type') {
        return;
      }
      if (key.includes('.')) {
        const parts = key.split('.');
        let level = config;
        for (const p of parts.slice(0, -1)) {
          if (p in level) {
            level = level[p];
          } else {
            level[p] = {};
            level = level[p];
          }
        }
        level[parts[parts.length - 1]] = value;
      } else if (key in config) {
        const v = config[key];
        if (Array.isArray(v)) {
          v.push(value);
        } else {
          config[key] = [v, value];
        }
      } else {
        config[key] = value;
      }
    });
    console.log(config);
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
  <div>
    <label for="widget-adder-w" class="uk-form-label">Widget</label>
    <select id="widget-adder-w" class="uk-select" name="type" label="Widget" bind:value required>
      <optgroup label="Charts">
        <option value="line">Time Series Widget</option>
        <option value="map">Choropleth Map Widget</option>
        <option value="hex">Hexagon Map Widget</option>
      </optgroup>
      <optgroup label="Tables">
        <option value="regiontable">Region Table Widget</option>
        <option value="datetable">Date Table Widget</option>
        <option value="sensortable">Indicator Table Widget</option>
      </optgroup>
      <optgroup label="Parallel Coordinates Plots">
        <option value="regionpcp">Region PCP Widget</option>
        <option value="datepcp">Date PCP Widget</option>
      </optgroup>
      <optgroup label="Simple">
        <option value="kpi">Value Widget</option>
        <option value="trend">Trend Widget</option>
      </optgroup>
      <optgroup label="Date Focussed">
        <option value="line">Time Series Widget</option>
        <option value="datetable">Date Table Widget</option>
        <option value="datepcp">Date PCP Widget</option>
      </optgroup>
      <optgroup label="Region Focussed">
        <option value="map">Choropleth Map Widget</option>
        <option value="hex">Hexagon Map Widget</option>
        <option value="regiontable">Region Table Widget</option>
        <option value="regionpcp">Region PCP Widget</option>
      </optgroup>
    </select>
  </div>
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

  .widget-adder :global(.uk-select:not([multiple]):not([size]) optgroup) {
    color: #444;
  }

  .widget-adder > :global(div) {
    margin: 1em 0;
  }
</style>
