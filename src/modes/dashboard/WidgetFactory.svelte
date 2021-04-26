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
  import { createResolver } from './configResolver';

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

  function createResolverImpl() {
    // wrap to avoid tracking
    return createResolver(sensor, region, date);
  }
  $: resolver = createResolverImpl();
</script>

{#if c.type === 'line'}
  <LineChartWidget
    sensor={resolver.sensor(c.config.sensor)}
    timeFrame={resolver.timeFrame(c.config.timeFrame)}
    region={resolver.region(c.config.region)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'map'}
  <MapChartWidget
    sensor={resolver.sensor(c.config.sensor)}
    date={resolver.date(c.config.date)}
    level={resolver.regionLevel(c.config.level)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'regiontable'}
  <RegionTableWidget
    sensor={resolver.sensor(c.config.sensor)}
    date={resolver.date(c.config.date)}
    level={resolver.regionLevel(c.config.level)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'datetable'}
  <DateTableWidget
    sensor={resolver.sensor(c.config.sensor)}
    region={resolver.region(c.config.region)}
    timeFrame={resolver.timeFrame(c.config.timeFrame)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'sensortable'}
  <SensorTableWidget
    region={resolver.region(c.config.region)}
    date={resolver.date(c.config.date)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'kpi'}
  <KPIWidget
    sensor={resolver.sensor(c.config.sensor)}
    date={resolver.date(c.config.date)}
    region={resolver.region(c.config.region)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'trend'}
  <KPITrendWidget
    sensor={resolver.sensor(c.config.sensor)}
    timeFrame={resolver.date(c.config.date)}
    region={resolver.region(c.config.region)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'hex'}
  <HexMapChartWidget
    sensor={resolver.sensor(c.config.sensor)}
    date={resolver.date(c.config.date)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'regionpcp'}
  <RegionParallelCoordinatesWidget
    sensors={resolver.sensors(c.config.sensors)}
    level={resolver.regionLevel(c.config.level)}
    date={resolver.date(c.config.date)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{:else if c.type === 'datepcp'}
  <DateParallelCoordinatesWidget
    sensors={resolver.sensors(c.config.sensors)}
    timeFrame={resolver.timeFrame(c.config.timeFrame)}
    region={resolver.region(c.config.region)}
    bind:highlight
    on:action={trackAction}
    on:state={trackState}
    id={c.id}
    initialState={c.state}
  />
{/if}
