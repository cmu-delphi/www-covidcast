<script>
  import DatePicker from './config/DatePicker.svelte';
  import LevelPicker from './config/LevelPicker.svelte';
  import RegionPicker from './config/RegionPicker.svelte';
  import SensorPicker from './config/SensorPicker.svelte';
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
</script>

{#if type === 'line'}
  <SensorPicker {sensor} />
  <RegionPicker {region} />
  <TimeFramePicker {sensor} {date} />
{:else if type === 'map'}
  <SensorPicker {sensor} />
  <LevelPicker {region} />
  <DatePicker {date} />
{:else if type === 'regiontable'}
  <SensorPicker {sensor} />
  <LevelPicker {region} />
  <DatePicker {date} />
{:else if type === 'datetable'}
  <SensorPicker {sensor} />
  <RegionPicker {region} />
  <TimeFramePicker {sensor} {date} />
{:else if type === 'sensortable'}
  <RegionPicker {region} />
  <DatePicker {date} />
{:else if type === 'kpi'}
  <SensorPicker {sensor} />
  <RegionPicker {region} />
  <DatePicker {date} />
{:else if type === 'trend'}
  <SensorPicker {sensor} />
  <RegionPicker {region} />
  <TimeFramePicker {sensor} {date} />
{:else if type === 'hex'}
  <SensorPicker {sensor} />
  <DatePicker {date} />
{:else if type === 'regionpcp'}
  <SensorPicker {sensor} multiple />
  <LevelPicker {region} />
  <DatePicker {date} />
{:else if type === 'datepcp'}
  <SensorPicker {sensor} multiple />
  <RegionPicker {region} />
  <TimeFramePicker {sensor} {date} />
{:else}
  Please select a widget first
{/if}
