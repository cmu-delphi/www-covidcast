<script>
  import DatePicker from './config/DatePicker.svelte';
  import LevelPicker from './config/LevelPicker.svelte';
  import RegionPicker from './config/RegionPicker.svelte';
  import SensorPicker from './config/SensorPicker.svelte';
  import SensorsPicker from './config/SensorsPicker.svelte';
  import TimeFramePicker from './config/TimeFramePicker.svelte';

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
</script>

{#if type === 'line'}
  <SensorPicker {sensor} value={config.sensor || ''} />
  <RegionPicker {region} value={config.region || ''} />
  <TimeFramePicker {sensor} {date} value={config.timeFrame} />
{:else if type === 'map'}
  <SensorPicker {sensor} value={config.sensor || ''} />
  <LevelPicker {region} value={config.level} />
  <DatePicker {date} value={config.date} />
{:else if type === 'regiontable'}
  <SensorPicker {sensor} value={config.sensor || ''} />
  <LevelPicker {region} value={config.level} />
  <DatePicker {date} value={config.date} />
{:else if type === 'datetable'}
  <SensorPicker {sensor} value={config.sensor || ''} />
  <RegionPicker {region} value={config.region || ''} />
  <TimeFramePicker {sensor} {date} value={config.timeFrame} />
{:else if type === 'sensortable'}
  <RegionPicker {region} value={config.region || ''} />
  <DatePicker {date} value={config.date} />
{:else if type === 'kpi'}
  <SensorPicker {sensor} value={config.sensor || ''} />
  <RegionPicker {region} value={config.region || ''} />
  <DatePicker {date} value={config.date} />
{:else if type === 'trend'}
  <SensorPicker {sensor} value={config.sensor || ''} />
  <RegionPicker {region} value={config.region || ''} />
  <TimeFramePicker {sensor} {date} value={config.timeFrame} />
{:else if type === 'hex'}
  <SensorPicker {sensor} value={config.sensor || ''} />
  <DatePicker {date} />
{:else if type === 'regionpcp'}
  <SensorsPicker {sensor} value={config.sensors || []} />
  <LevelPicker {region} value={config.level} />
  <DatePicker {date} value={config.date} />
{:else if type === 'datepcp'}
  <SensorsPicker {sensor} value={config.sensors || []} />
  <RegionPicker {region} value={config.region || ''} />
  <TimeFramePicker {sensor} {date} value={config.timeFrame} />
{:else}
  Please select a widget first
{/if}
