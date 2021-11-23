<script>
  import LineChartWidget from './widgets/LineChartWidget.svelte';
  import KPIWidget from './widgets/KPIWidget.svelte';
  import MapChartWidget from './widgets/MapChartWidget.svelte';
  import HexMapChartWidget from './widgets/HexMapChartWidget.svelte';
  import RegionParallelCoordinatesWidget from './widgets/RegionParallelCoordinatesWidget.svelte';
  import DateParallelCoordinatesWidget from './widgets/DateParallelCoordinatesWidget.svelte';
  import RegionTableWidget from './widgets/RegionTableWidget.svelte';
  import DateTableWidget from './widgets/DateTableWidget.svelte';
  import SensorTableWidget from './widgets/SensorTableWidget.svelte';
  import AnomaliesWidget from './widgets/AnomaliesWidget.svelte';
  import ZoomedMapChartWidget from './widgets/ZoomedMapChartWidget.svelte';
  import {
    resolveDate,
    resolveRegion,
    resolveRegionLevel,
    resolveSensor,
    resolveSensors,
    resolveTimeFrame,
  } from './configResolver';

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

  export let trackAction;
  export let trackState;
</script>

{#if c.type === 'line'}
  <LineChartWidget
    sensor={resolveSensor(sensor, c.config.sensor)}
    timeFrame={resolveTimeFrame(sensor, date, c.config.timeFrame)}
    region={resolveRegion(region, c.config.region)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'map'}
  <MapChartWidget
    sensor={resolveSensor(sensor, c.config.sensor)}
    date={resolveDate(date, c.config.date)}
    level={resolveRegionLevel(region, c.config.level)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'zoomedmap'}
  <ZoomedMapChartWidget
    sensor={resolveSensor(sensor, c.config.sensor)}
    date={resolveDate(date, c.config.date)}
    region={resolveRegion(region, c.config.region)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'regiontable'}
  <RegionTableWidget
    sensor={resolveSensor(sensor, c.config.sensor)}
    date={resolveDate(date, c.config.date)}
    level={resolveRegionLevel(region, c.config.level)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'datetable'}
  <DateTableWidget
    sensor={resolveSensor(sensor, c.config.sensor)}
    region={resolveRegion(region, c.config.region)}
    timeFrame={resolveTimeFrame(sensor, date, c.config.timeFrame)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'sensortable'}
  <SensorTableWidget
    region={resolveRegion(region, c.config.region)}
    date={resolveDate(date, c.config.date)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'kpi'}
  <KPIWidget
    sensor={resolveSensor(sensor, c.config.sensor)}
    date={resolveDate(date, c.config.date)}
    region={resolveRegion(region, c.config.region)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'hex'}
  <HexMapChartWidget
    sensor={resolveSensor(sensor, c.config.sensor)}
    date={resolveDate(date, c.config.date)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'regionpcp'}
  <RegionParallelCoordinatesWidget
    sensors={resolveSensors(sensor, c.config.sensors)}
    level={resolveRegionLevel(region, c.config.level)}
    date={resolveDate(date, c.config.date)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'datepcp'}
  <DateParallelCoordinatesWidget
    sensors={resolveSensors(sensor, c.config.sensors)}
    timeFrame={resolveTimeFrame(sensor, date, c.config.timeFrame)}
    region={resolveRegion(region, c.config.region)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'anomalies'}
  <AnomaliesWidget
    sensor={resolveSensor(sensor, c.config.sensor)}
    timeFrame={resolveTimeFrame(sensor, date, c.config.timeFrame)}
    region={resolveRegion(region, c.config.region)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{/if}
