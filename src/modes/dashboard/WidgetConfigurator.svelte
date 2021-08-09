<script>
  import DatePicker from './config/DatePicker.svelte';
  import LevelPicker from './config/LevelPicker.svelte';
  import RegionPicker from './config/RegionPicker.svelte';
  import SensorPicker from './config/SensorPicker.svelte';
  import SensorsPicker from './config/SensorsPicker.svelte';
  import TimeFramePicker from './config/TimeFramePicker.svelte';
  import { findWidget } from './state';

  export let type;
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

  export let config = {};

  $: hasConfig = new Set(findWidget(type || 'line').configOptions);
</script>

{#if hasConfig.has('sensor')}
  <SensorPicker {sensor} value={config.sensor || ''} />
{/if}
{#if hasConfig.has('sensors')}
  <SensorsPicker {sensor} value={config.sensors || ''} />
{/if}
{#if hasConfig.has('region')}
  <RegionPicker {region} value={config.region || ''} />
{/if}
{#if hasConfig.has('level')}
  <LevelPicker {region} value={config.level} />
{/if}
{#if hasConfig.has('date')}
  <DatePicker {sensor} {date} value={config.date} />
{/if}
{#if hasConfig.has('timeFrame')}
  <TimeFramePicker {sensor} {date} value={config.timeFrame} />
{/if}
