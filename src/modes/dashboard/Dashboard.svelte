<script>
  import { onMount, setContext } from 'svelte';
  import { currentRegionInfo, currentDateObject, currentSensor, isMobileDevice, metaDataManager } from '../../stores';
  import { SensorParam, DateParam, RegionParam } from '../../stores/params';
  import { WidgetHighlight } from './highlight';
  import { resolveInitialState, updateState } from './state';
  import isEqual from 'lodash-es/isEqual';
  import WidgetAdder from './WidgetAdder.svelte';
  import WidgetEditor from './WidgetEditor.svelte';
  import WidgetFactory from './WidgetFactory.svelte';
  import DashboardParameters from './DashboardParameters.svelte';

  import { DEFAULT_SENSOR } from '../../stores/constants';
  import { DataFetcher } from '../../stores/DataFetcher';

  $: resolvedSensor = $metaDataManager.getSensor($currentSensor) || $metaDataManager.getSensor(DEFAULT_SENSOR);
  $: sensor = new SensorParam(resolvedSensor, $metaDataManager);
  $: region = new RegionParam($currentRegionInfo);
  $: date = new DateParam($currentDateObject);

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
    updateState(state);
    console.log(state);
  }

  function deriveComponents(state) {
    return state.order.map((id) => {
      return {
        id,
        type: id.split('_')[0],
        config: state.configs[id] || {},
        state: state.states[id],
      };
    });
  }

  let components = deriveComponents(initialState);

  $: nextId =
    components.reduce((acc, v) => {
      const index = Number.parseInt(v.id.split('_')[1], 10);
      return Math.max(acc, index);
    }, 0) + 1;

  function trackState(event) {
    state = {
      ...state,
      states: {
        ...state.states,
        [event.detail.id]: event.detail.state,
      },
    };
  }

  function closeWidget(id) {
    const states = { ...state.states };
    delete states[id];
    const configs = { ...state.configs };
    delete configs[id];
    state = {
      ...state,
      order: state.order.filter((d) => d !== id),
      states,
      configs,
    };
    components = deriveComponents(state);
  }

  /**
   * @type {{id: string, config: Record<string, unknown>}}
   */
  let edit = null;
  let refOpenAdder = null;
  let refCloseAdder = null;

  function closeSideBar() {
    edit = null;
  }

  function editWidget(id) {
    edit = {
      id,
      config: state.configs[id] || {},
    };
    if (refOpenAdder) {
      refOpenAdder.click();
    }
  }

  function editedWidget(event) {
    if (refCloseAdder) {
      refCloseAdder.click();
    }
    const id = event.detail.id;
    const config = event.detail.config;

    edit = null;
    state = {
      ...state,
      configs: {
        ...state.configs,
        [id]: config,
      },
    };
    components = deriveComponents(state);
  }

  function trackAction(event) {
    const type = event.detail.type;
    const id = event.detail.id;
    if (type === 'close') {
      closeWidget(id);
    } else if (type === 'config') {
      editWidget(id);
    }
  }

  function addWidget(event) {
    if (refCloseAdder) {
      refCloseAdder.click();
    }
    const data = event.detail;
    const states = { ...state.states };
    if (data.state) {
      states[data.id] = data.state;
    }
    const configs = { ...state.configs };
    if (data.config) {
      configs[data.id] = data.config;
    }
    state = {
      ...state,
      order: [...state.order, data.id],
      states,
      configs,
    };
    components = deriveComponents(state);
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

  let configureParams = false;

  function updateTitle(e) {
    const title = e.currentTarget.value;
    if (title === state.title || (!state.title && title === 'Dashboard')) {
      return;
    }
    state = {
      ...state,
      title,
    };
  }
</script>

<div class="root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <button
        bind:this={refOpenAdder}
        class="widget-add-button uk-button uk-button-primary"
        type="button"
        title="Add New Widget"
        uk-toggle="target: #offcanvas-overlay">Add Widget</button
      >
      <h2>
        COVIDcast
        <span>
          {#if configureParams}
            <input class="title-text" type="text" value={state.title || 'Dashboard'} required on:change={updateTitle} />
          {:else}
            {state.title || 'Dashboard'}
          {/if}
        </span>
      </h2>
      <button
        class="widget-edit-button uk-icon-button"
        type="button"
        title="Edit Configuration"
        uk-icon="cog"
        on:click={() => (configureParams = !configureParams)}
      />
    </div>
    {#if configureParams}
      <DashboardParameters {sensor} {region} {date} />
    {/if}
  </div>
  {#if $isMobileDevice}
    <div class="uk-alert uk-alert-warning">This view is optimized for larger screens only</div>
  {/if}
  <div id="offcanvas-overlay" uk-offcanvas="overlay: true">
    <div class="uk-offcanvas-bar">
      <button bind:this={refCloseAdder} on:click={closeSideBar} class="uk-offcanvas-close" type="button" uk-close />
      {#if edit}
        <WidgetEditor on:edit={editedWidget} {sensor} {region} {date} id={edit.id} config={edit.config} />
      {:else}
        <WidgetAdder on:add={addWidget} {sensor} {region} {date} {nextId} />
      {/if}
    </div>
  </div>
  <div class="panel-wrapper">
    <div bind:this={panelRef} class="panel" data-uk-sortable="handle: .widget-move-handle">
      {#each components as c (c.id)}
        <WidgetFactory {c} bind:highlight {sensor} {region} {date} {trackAction} {trackState} />
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

  .widget-add-button {
    position: absolute;
    left: 1em;
    top: -11px;
  }
  .widget-edit-button {
    position: absolute;
    right: 1em;
    top: -11px;
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
    grid-auto-rows: 1fr;
    gap: 0.5em;
  }

  .title-text {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 1.25rem;
    padding: 0;
    margin: 0;
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
