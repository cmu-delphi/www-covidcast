<script>
  import { onMount, setContext } from 'svelte';
  import {
    currentSensor,
    currentSensor2,
    currentSensorEntry2,
    isMobileDevice,
    sensorList,
    sensorMap,
  } from '../../stores';
  import { currentRegionInfo, currentSensorEntry, currentDateObject, times } from '../../stores';
  import { SensorParam, DateParam, RegionParam, DataFetcher, TimeFrame } from '../../stores/params';
  import { WidgetHighlight } from './highlight';
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
  import { resolveInitialState, updateState } from './state';
  import isEqual from 'lodash-es/isEqual';
  import { getInfoByName } from '../../data/regions';
  import { parseAPITime } from '../../data';

  $: sensor = new SensorParam($currentSensorEntry, currentSensor, $times);
  $: sensor2 = new SensorParam($currentSensorEntry2, currentSensor2, $times);
  $: region = new RegionParam($currentRegionInfo);
  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);
  }

  setContext('fetcher', fetcher);

  /**
   * @type {import('./highlight').WidgetHighlight | null}
   */
  let highlight = null;

  function initHighlight(sensor, region, date) {
    highlight = new WidgetHighlight(sensor.value, region.value, date.value);
  }
  $: {
    initHighlight(sensor, region, date);
  }

  let initialState = resolveInitialState();

  let state = initialState;

  $: {
    console.log(state);
    updateState(state);
  }

  function deriveComponents(state) {
    return state.order.map((id) => {
      return {
        id,
        type: id.split('-')[0],
        config: state.configs[id] || {},
        state: state.states[id],
      };
    });
  }

  let components = deriveComponents(initialState);

  function trackState(event) {
    state = {
      ...state,
      states: {
        ...state.states,
        [event.detail.id]: event.detail.state,
      },
    };
  }

  function trackClose(event) {
    const id = event.detail;
    const states = { ...state.states };
    delete states[id];
    state = {
      order: state.order.filter((d) => d !== id),
      states,
    };
  }

  let panelRef = null;

  onMount(() => {
    panelRef.addEventListener('moved', () => {
      const widgets = Array.from(panelRef.querySelectorAll('.widget-card'), (d) => d.dataset.id);
      if (!isEqual(widgets, state.order)) {
        state = {
          ...state,
          order: widgets,
        };
      }
    });
  });

  function resolveSensor(key) {
    if (!key) {
      return sensor;
    }
    const s = sensorMap.get(key);
    if (!s) {
      return sensor;
    }
    return new SensorParam(s, currentSensor, $times);
  }
  function resolveSensors(keys) {
    if (!keys) {
      return sensorList.slice().reverse().slice(0, 3);
    }
    return keys.map((k) => sensorMap.get(k)).filter(Boolean);
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
    return new DateParam(parseAPITime(d), sensor.value, $times);
  }
  function resolveTimeFrame(d) {
    if (!d) {
      return date.windowTimeFrame;
    }
    if (typeof d === 'string') {
      const sensor = resolveSensor(d);
      return sensor.timeFrame;
    }
    return new TimeFrame(parseAPITime(d.min), parseAPITime(d.max));
  }
</script>

<div class="root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>COVIDcast <span>Dashboard</span></h2>
    </div>
  </div>
  {#if $isMobileDevice}
    <div class="uk-alert uk-alert-warning">This view is optimized for larger screens only</div>
  {/if}
  <div class="panel-wrapper">
    <div bind:this={panelRef} class="panel" data-uk-sortable="handle: .widget-move-handle">
      {#each components as c (c.id)}
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
      {/each}
    </div>
  </div>
</div>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    font-size: 0.875rem;
    line-height: 1.5rem;
    display: flex;
    flex-direction: column;
  }

  .panel-wrapper {
    flex: 1 1 0;
    position: relative;
  }
  .panel {
    position: absolute;
    left: 0.5em;
    top: 0.5em;
    right: 0.5em;
    bottom: 0.5em;
    display: grid;
    --ncol: 3;
    --nrow: 4;
    grid-template-columns: repeat(var(--ncol), 1fr);
    grid-template-rows: repeat(var(--nrow), 1fr);
    grid-auto-flow: dense;
    gap: 0.5em;
  }

  @media only screen and (min-width: 800px) {
    .panel {
      --ncol: 5;
    }
  }
  @media only screen and (min-width: 1000px) {
    .panel {
      --ncol: 5;
    }
  }
  @media only screen and (min-width: 1200px) {
    .panel {
      --ncol: 5;
    }
  }
  @media only screen and (min-width: 1400px) {
    .panel {
      --ncol: 6;
    }
  }
  @media only screen and (min-width: 1600px) {
    .panel {
      --ncol: 7;
    }
  }
  @media only screen and (min-width: 1800px) {
    .panel {
      --ncol: 8;
    }
  }
  @media only screen and (min-width: 2000px) {
    .panel {
      --ncol: 9;
    }
  }
  @media only screen and (min-height: 800px) {
    .panel {
      --nrow: 4;
    }
  }
  @media only screen and (min-height: 1000px) {
    .panel {
      --nrow: 5;
    }
  }
  @media only screen and (min-height: 1200px) {
    .panel {
      --nrow: 6;
    }
  }
</style>
