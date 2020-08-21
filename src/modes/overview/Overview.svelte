<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import Options from '../../components/Options.svelte';
  import FaChartLine from 'svelte-icons/fa/FaChartLine.svelte';
  import {
    signalType,
    currentSensor,
    currentLevel,
    encoding,
    currentZone,
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
  } from '../../stores';
  import Search from '../../components/Search.svelte';
  import SmallMultiplesPanel from './SmallMultiplesPanel.svelte';
  import DetailView from '../../components/DetailView/DetailView.svelte';
  import MapOverlays from '../../components/MapOverlays.svelte';
  import { fetchRegionSlice } from '../../data/fetchData';
  import { nameInfos } from '../../maps';

  /**
   * @type {MapBox}
   */
  let map;

  function initialReady() {
    if ($currentZone === 'swpa') {
      map.zoom.showSWPA();
    }
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
    if ($encoding === 'bubble') {
      bubbleRadiusScale.set(info.custom);
    }
    if ($encoding === 'spike') {
      spikeHeightScale.set(info.custom);
    }
  }

  /**
   * @type {import('../../data/fetchData').SensorEntry | null}
   */
  let detailSensor = null;

  let loading = true;
  $: data = fetchRegionSlice($currentSensorEntry, $currentLevel, $currentDateObject);

  let mobileShowMap = true;
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    display: grid;
    grid-template-columns: 1fr min(25%, 30em);
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'options search'
      'map panel';
    gap: 6px;
    background: var(--bg);
  }

  .root > :global(.options-container) {
    grid-area: options;
  }

  .root > :global(.search-container) {
    grid-area: search;
    margin: 0 6px 6px 6px;
  }

  .map-container {
    grid-area: map;
    position: relative;
  }

  .panel-container {
    grid-area: panel;
    position: relative;
    margin-right: 6px;
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
    right: 0;
    z-index: 1005;
    width: 100%;
    top: 20%;
    height: 60%;
    display: flex;
    flex-direction: column;
  }

  .view-switcher {
    display: none;
    grid-area: view;
  }

  .map-button {
    background-size: 80%;
    background-position: center;
    background-repeat: no-repeat;
    color: transparent;
    background-image: url('../../assets/imgs/choropleth.png');
  }

  .chart-button {
    color: #8c8c8c;
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
    .root > :global(.search-container) {
      margin: 0 6px;
    }

    .mobileHide {
      display: none !important;
    }

    .panel-container {
      grid-area: map;
    }
    .view-switcher {
      display: flex;
      margin-right: 6px;
    }
  }
</style>

<main class="root base-font-size">
  <Options className="options-container" />
  <Search
    className="search-container container-bg container-style"
    placeholder="Search for a location..."
    items={nameInfos}
    selectedItem={$currentRegionInfo}
    labelFieldName="displayName"
    maxItemsToShowInList="5"
    on:change={(e) => selectByInfo(e.detail)} />

  <div class="view-switcher">
    <div class="pg-button-group">
      <button
        aria-pressed={String(mobileShowMap)}
        class="pg-button map-button"
        class:selected={mobileShowMap}
        on:click={() => {
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
          mobileShowMap = false;
        }}
        title="Switch to Line Charts">
        <span aria-hidden>Switch to Line Charts</span>
        <FaChartLine />
      </button>
    </div>
  </div>

  <div class="map-container" class:mobileHide={!mobileShowMap}>
    <MapOverlays {map} mapLoading={loading} legendLoading={loading} />
    <MapBox
      bind:this={map}
      on:loading={(e) => (loading = e.detail)}
      {data}
      sensor={$currentSensor}
      level={$currentLevel}
      signalType={$signalType}
      signalOptions={$signalCasesOrDeathOptions}
      selection={$currentRegionInfo}
      encoding={$encoding}
      on:ready={() => initialReady()}
      on:updatedEncoding={(e) => updatedEncoding(e.detail)}
      on:select={(e) => selectByFeature(e.detail)} />

    {#if detailSensor != null}
      <div class="detail-container container-bg container-style">
        <DetailView sensor={detailSensor} on:close={() => (detailSensor = null)} />
      </div>
    {/if}
  </div>

  {#if !isMobileDevice || !mobileShowMap}
    <div class="panel-container container-bg container-style">
      <div class="panel-scroll-container">
        <SmallMultiplesPanel bind:detail={detailSensor} />
      </div>
    </div>
  {/if}
</main>
