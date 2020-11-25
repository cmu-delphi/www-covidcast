<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import Options from '../../components/Options.svelte';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import FaChartLine from 'svelte-icons/fa/FaChartLine.svelte';
  import {
    signalType,
    currentSensor,
    currentLevel,
    encoding,
    colorScale,
    colorStops,
    bubbleRadiusScale,
    spikeHeightScale,
    currentRegionInfo,
    currentRegion,
    selectByInfo,
    selectByFeature,
    currentSensorEntry,
    currentDateObject,
    signalCasesOrDeathOptions,
    isMobileDevice,
    currentCompareSelection,
    currentSensorMapTitle,
    currentMultiSelection,
    addCompare,
    removeCompare,
  } from '../../stores';
  import Search from '../../components/Search.svelte';
  import SmallMultiplesPanel from './SmallMultiplesPanel.svelte';
  import { fetchRegionSlice } from '../../data';
  import DetailView from '../../components/DetailView/DetailView.svelte';
  import MapOverlays from '../../components/MapOverlays.svelte';
  import { trackEvent } from '../../stores/ga';
  import FaBan from 'svelte-icons/fa/FaBan.svelte';
  import AddAnother from './AddAnother.svelte';
  import { getInfoByName } from '../../maps';

  export let wrapperClass;
  export let regionSearchList;
  export let levelList;

  /**
   * @type {MapBox}
   */
  let map;

  function initialReady() {
    if (!$currentRegion) {
      map.selectRandom();
    }
  }

  function updatedEncoding(info) {
    if (!info) {
      return;
    }
    if (info.scale) {
      colorScale.set(info.scale);
    }
    colorStops.set(info.stops);
    if ($encoding === 'bubble' && info.custom) {
      bubbleRadiusScale.set(info.custom);
    }
    if ($encoding === 'spike' && info.custom) {
      spikeHeightScale.set(info.custom);
    }
  }

  /**
   * @type {import('../../data/fetchData').SensorEntry | null}
   */
  let detailSensor = null;

  let loading = true;
  $: {
    // enforce level is valid
    if (!levelList.find((d) => d.id === $currentLevel)) {
      currentLevel.set(levelList[0].id);
    }
  }
  $: data = fetchRegionSlice($currentSensorEntry, $currentLevel, $currentDateObject, {
    stderr: null,
  });

  let mobileShowMap = true;
  let desktopShowPanel = true;
  let pickMapMode = false;
  let zoom = 1;

  $: showCompare = $currentCompareSelection != null;

  $: selections = $currentMultiSelection;
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    display: grid;
    grid-template-columns: 1fr min(25%, 30em) auto;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'options search view'
      'map panel panel';
    background-color: white;
  }

  .root.compare {
    grid-template-columns: 1fr min(25%, 30em) min(25%, 30em);
    grid-template-areas:
      'options dummy dummy'
      'map panel add';
  }

  .root > :global(.options-container) {
    grid-area: options;
    z-index: 1010;
  }

  .root > :global(.search-container) {
    grid-area: search;
    z-index: 1009;
    margin: 0.3em;
  }

  .map-container {
    grid-area: map;
    position: relative;
  }

  .panel-container {
    grid-area: panel;
    display: flex;
    flex-direction: column;
    margin-right: 6px;
  }

  .add-container {
    grid-area: add;
    display: flex;
    flex-direction: column;
    margin-right: 6px;
  }

  .panel-wrapper {
    position: relative;
    flex: 1 1 0;
  }

  .panel-bottom-wrapper {
    margin-top: 6px;
    margin-bottom: 6px;
    display: flex;
    justify-content: center;
  }

  .panel-scroll-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .detail-container {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1005;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .pick :global(*) {
    cursor: crosshair !important;
  }

  .view-switcher {
    display: flex;
    margin: 6px;
    grid-area: view;
  }

  .map-button {
    background-size: 80%;
    background-position: center;
    background-repeat: no-repeat;
    color: transparent;
    background-image: url('../../assets/imgs/choropleth_small.png');
  }

  .chart-button {
    color: #8c8c8c;
  }

  .hiddenPanel {
    grid-template-areas:
      'options search view'
      'map map map';
  }

  .single-toggle > :global(svg:last-of-type) {
    display: none;
    position: absolute;
  }

  .single-toggle.selected > :global(svg:first-of-type) {
    opacity: 0.5;
    width: 70%;
  }
  .single-toggle.selected > :global(svg:last-of-type) {
    display: unset;
    opacity: 0.5;
  }

  .selection-legend {
    list-style-type: none;
  }
  .selection-legend::before {
    content: '\25FC';
    margin-left: -1em;
    padding-right: 0.2em;
  }

  .selection-legend:hover .selection-toolbar {
    opacity: 1;
  }

  .selection-toolbar {
    font-size: 0.7rem;
    float: right;
    opacity: 0;
  }

  .selection-container {
    margin-bottom: 6px;
  }
  .selection-container > ul {
    margin: 0;
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    .root {
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto 1fr;
      grid-template-areas:
        'options options'
        'search view'
        'map map';
    }

    .mobileHide {
      display: none !important;
    }

    .panel-container {
      grid-area: map;
    }
  }
</style>

<main class="root base-font-size" class:hiddenPanel={!$isMobileDevice && !desktopShowPanel} class:compare={showCompare}>
  <Options className="options-container" levels={levelList} />

  {#if !showCompare}
    <Search
      className="search-container container-bg container-style"
      placeholder="Search for a location..."
      items={regionSearchList}
      selectedItem={$currentRegionInfo}
      labelFieldName="displayName"
      maxItemsToShowInList="5"
      on:change={(e) => {
        selectByInfo(e.detail);
        trackEvent('search', 'select', e.detail ? e.detail.id : '');
      }} />

    <div class="view-switcher">
      {#if !$isMobileDevice}
        <button
          aria-pressed={String(!desktopShowPanel)}
          class="pg-button chart-button single-toggle"
          class:selected={desktopShowPanel}
          on:click={() => {
            trackEvent('overview', 'show-panel', String(!desktopShowPanel));
            desktopShowPanel = !desktopShowPanel;
          }}
          title="{desktopShowPanel ? 'Hide' : 'Show'} Line Charts panel">
          <span aria-hidden>{desktopShowPanel ? 'Hide' : 'Show'} Line Charts panel</span>
          <FaChartLine />
          <FaBan />
        </button>
      {:else}
        <div class="pg-button-group">
          <button
            aria-pressed={String(mobileShowMap)}
            class="pg-button map-button"
            class:selected={mobileShowMap}
            on:click={() => {
              trackEvent('overview', 'show-map', 'true');
              mobileShowMap = true;
            }}
            title="Switch to Map">
            <span aria-hidden>Switch to Map</span>
            <FaChartLine />
          </button>
          <button
            aria-pressed={String(!mobileShowMap)}
            class="pg-button chart-button"
            class:selected={!mobileShowMap}
            on:click={() => {
              trackEvent('overview', 'show-map', 'false');
              mobileShowMap = false;
            }}
            title="Switch to Line Charts">
            <span aria-hidden>Switch to Line Charts</span>
            <FaChartLine />
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <div class="map-container" class:mobileHide={!mobileShowMap} class:pick={pickMapMode}>
    <MapOverlays
      {map}
      mapLoading={loading}
      legendLoading={loading}
      {zoom}
      summary={{ data, level: $currentLevel, items: regionSearchList }} />
    <MapBox
      bind:this={map}
      on:loading={(e) => (loading = e.detail)}
      {data}
      sensor={$currentSensor}
      level={$currentLevel}
      signalType={$signalType}
      signalOptions={$signalCasesOrDeathOptions}
      {selections}
      encoding={$encoding}
      on:ready={() => initialReady()}
      on:zoom={(e) => (zoom = e.detail)}
      on:updatedEncoding={(e) => updatedEncoding(e.detail)}
      on:select={(e) => {
        if (pickMapMode) {
          const info = getInfoByName(e.detail.feature.properties.id);
          addCompare(info);
          pickMapMode = false;
        } else {
          selectByFeature(e.detail.feature, true);
          if (e.detail.feature) {
            trackEvent('map', 'select', e.detail.feature.id);
          }
        }
      }}
      {wrapperClass}
      title={$currentSensorMapTitle} />

    {#if detailSensor != null && !$isMobileDevice && desktopShowPanel}
      <div class="detail-container container-bg container-style">
        <DetailView sensor={detailSensor} {selections} on:close={() => (detailSensor = null)} />
      </div>
    {/if}
  </div>

  {#if ($isMobileDevice && !mobileShowMap) || (!$isMobileDevice && desktopShowPanel)}
    <div class="panel-container">
      <div class="panel-wrapper container-bg container-style">
        <div class="panel-scroll-container">
          <SmallMultiplesPanel bind:detail={detailSensor} levels={levelList} {selections} />
        </div>
      </div>
      <div class="panel-bottom-wrapper mobileHide">
        <button class="pg-button pg-text-button" on:click={() => currentCompareSelection.set(showCompare ? null : [])}>
          {showCompare ? 'Exit' : 'Open'} compare mode
        </button>
      </div>
    </div>
  {/if}
  {#if showCompare}
    <div class="add-container">
      <div class="selection-container container-bg container-style">
        <ul>
          {#each selections as selection}
            <li class="selection-legend" style="color: {selection.color}">
              <button
                class="selection-toolbar pg-button"
                on:click={() => removeCompare(selection.info)}
                title="Remove selected">
                <IoIosClose />
              </button>
              <span>{selection.info.displayName}</span>
            </li>
          {/each}
        </ul>
      </div>
      <AddAnother
        {regionSearchList}
        bind:pickMapMode
        on:add={(e) => addCompare(e.detail)}
        {selections}
        mapData={data} />
    </div>
  {/if}
</main>
