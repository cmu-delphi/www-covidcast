<script>
  import { onMount, setContext } from 'svelte';
  import { currentRegionInfo, currentDateObject, currentSensor, isMobileDevice, metaDataManager } from '../../stores';
  import { SensorParam, DateParam, RegionParam } from '../../stores/params';
  import { WidgetHighlight } from './highlight';
  import {
    addWidget,
    changeOrder,
    changeTitle,
    changeWidgetConfig,
    changeWidgetState,
    deriveComponents,
    removeWidget,
    resolveInitialState,
    updateState,
  } from './state';
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

  let components = deriveComponents(initialState);

  $: nextId =
    components.reduce((acc, v) => {
      const index = Number.parseInt(v.id.split('_')[1], 10);
      return Math.max(acc, index);
    }, 0) + 1;

  function trackState(event) {
    state = changeWidgetState(state, event.detail.id, event.detail.state);
  }

  function closeWidget(id) {
    state = removeWidget(state, id);
    components = deriveComponents(state);
  }

  /**
   * @type {{id: string, config: Record<string, unknown>}}
   */
  let edit = null;
  let add = false;

  function triggerAddWidget() {
    add = true;
  }

  function closeSideBar() {
    edit = null;
    add = false;
  }

  function editWidget(id) {
    edit = {
      id,
      config: state.configs[id] || {},
    };
  }

  function editedWidget(event) {
    const id = event.detail.id;
    const config = event.detail.config;
    edit = null;
    state = changeWidgetConfig(state, id, config);
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

  function addedWidget(event) {
    const data = event.detail;
    add = false;
    state = addWidget(state, data.id, data.config, data.state);
    components = deriveComponents(state);
  }

  let panelRef = null;

  onMount(() => {
    panelRef.addEventListener('moved', () => {
      const widgets = Array.from(panelRef.querySelectorAll('.widget-card'), (d) => d.dataset.id);
      if (!isEqual(widgets, state.order)) {
        state = changeOrder(state, widgets);
      }
    });
  });

  let configureParams = true;

  function updateTitle(e) {
    const title = e.currentTarget.value;
    if (title === state.title || (!state.title && title === 'Dashboard')) {
      return;
    }
    state = changeTitle(state, title);
  }
</script>

<div class="root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <button
        class="widget-add-button uk-button uk-button-primary"
        type="button"
        title="Add New Widget"
        on:click={triggerAddWidget}>Add Widget</button
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
        class:active-button={configureParams}
        title="Show/Hide Parameters"
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

  {#if edit || add}
    <div class="overlay-container">
      <button on:click={closeSideBar} type="button" class="uk-icon uk-close" uk-icon="close" title="Close Overlay" />
      {#if edit}
        <WidgetEditor on:edit={editedWidget} {sensor} {region} {date} id={edit.id} config={edit.config} />
      {:else}
        <WidgetAdder on:add={addedWidget} {sensor} {region} {date} {nextId} />
      {/if}
    </div>
  {/if}
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

  .overlay-container {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    background: #fafafc;
    border-top: 1px solid #d3d4d8;
    border-right: 1px solid #d3d4d8;
    padding: 1em;
  }

  .active-button {
    background: #ebebeb;
  }

  .overlay-container :global(input[type='text'], input[type='date'], select) {
    background: white;
  }

  .overlay-container .uk-close {
    float: right;
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
    bottom: 0;
    display: grid;
    --ncol: 3;
    --nrow: 4;
    grid-template-columns: repeat(var(--ncol), 1fr);
    grid-template-rows: repeat(var(--nrow), minmax(10rem, 1fr));
    grid-auto-flow: dense;
    grid-auto-rows: minmax(10rem, 1fr);
    gap: 0.5em;
    overflow-y: auto;
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
