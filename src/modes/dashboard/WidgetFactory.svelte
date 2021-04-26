<script>
  import LineChartWidget from './widgets/LineChartWidget.svelte';
  import KPIWidget from './widgets/KPIWidget.svelte';
  import MapChartWidget from './widgets/MapChartWidget.svelte';
  import HexMapChartWidget from './widgets/HexMapChartWidget.svelte';
  import KPITrendWidget from './widgets/KPITrendWidget.svelte';
  import RegionParallelCoordinatesWidget from './widgets/RegionParallelCoordinatesWidget.svelte';
  import DateParallelCoordinatesWidget from './widgets/DateParallelCoordinatesWidget.svelte';
  import RegionTableWidget from './widgets/RegionTableWidget.svelte';
  import DateTableWidget from './widgets/DateTableWidget.svelte';
  import SensorTableWidget from './widgets/SensorTableWidget.svelte';
  import { currentSensor, times } from '../../stores';
  import { getInfoByName } from '../../data/regions';
  import { CASES, DateParam, DEATHS, RegionParam, SensorParam, TimeFrame } from '../../stores/params';
  import { parseAPITime } from '../../data';
  import { allSensorsMap } from '../../stores/allSensors';

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

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;
  export let c;

  export let trackClose;
  export let trackState;

  function resolveSensor(key) {
    if (!key) {
      return sensor;
    }
    const s = allSensorsMap.get(key);
    if (!s) {
      return sensor;
    }
    return new SensorParam(s, currentSensor, $times);
  }

  function resolveSensors(keys) {
    if (!keys) {
      return [sensor.value, CASES.value, DEATHS.value];
    }
    return keys.map((k) => allSensorsMap.get(k)).filter(Boolean);
  }
  function resolveRegion(r) {
    if (!r) {
      return region;
    }
    const rr = getInfoByName(r);
    if (!rr) {
      return region;
    }
    return new RegionParam(rr);
  }
  function resolveRegionLevel(level) {
    if (!level) {
      return region.level;
    }
    return level;
  }
  function resolveDate(d) {
    if (!d) {
      return date;
    }
    return new DateParam(parseAPITime(d.toString().replace(/-/gm, '')), sensor.value, $times);
  }
  function resolveTimeFrame(d) {
    if (!d) {
      return date.windowTimeFrame;
    }
    if (typeof d === 'string') {
      const sensor = resolveSensor(d);
      return sensor.timeFrame;
    }
    return new TimeFrame(
      parseAPITime(d.min.toString().replace(/-/gm, '')),
      parseAPITime(d.max.toString().replace(/-/gm, '')),
    );
  }
</script>

{#if c.type === 'line'}
  <LineChartWidget
    sensor={resolveSensor(c.config.sensor)}
    timeFrame={resolveTimeFrame(c.config.timeFrame)}
    region={resolveRegion(c.config.region)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'map'}
  <MapChartWidget
    sensor={resolveSensor(c.config.sensor)}
    date={resolveDate(c.config.date)}
    level={resolveRegionLevel(c.config.level)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'regiontable'}
  <RegionTableWidget
    sensor={resolveSensor(c.config.sensor)}
    date={resolveDate(c.config.date)}
    level={resolveRegionLevel(c.config.level)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'datetable'}
  <DateTableWidget
    sensor={resolveSensor(c.config.sensor)}
    region={resolveRegion(c.config.region)}
    timeFrame={resolveTimeFrame(c.config.timeFrame)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'sensortable'}
  <SensorTableWidget
    region={resolveRegion(c.config.region)}
    date={resolveDate(c.config.date)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'kpi'}
  <KPIWidget
    sensor={resolveSensor(c.config.sensor)}
    date={resolveDate(c.config.date)}
    region={resolveRegion(c.config.region)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'trend'}
  <KPITrendWidget
    sensor={resolveSensor(c.config.sensor)}
    timeFrame={resolveDate(c.config.date)}
    region={resolveRegion(c.config.region)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'hex'}
  <HexMapChartWidget
    sensor={resolveSensor(c.config.sensor)}
    date={resolveDate(c.config.date)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'regionpcp'}
  <RegionParallelCoordinatesWidget
    sensors={resolveSensors(c.config.sensors)}
    level={resolveRegionLevel(c.config.level)}
    date={resolveDate(c.config.date)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'datepcp'}
  <DateParallelCoordinatesWidget
    sensors={resolveSensors(c.config.sensors)}
    timeFrame={resolveTimeFrame(c.config.timeFrame)}
    region={resolveRegion(c.config.region)}
    bind:highlight
    on:close={trackClose}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{/if}
