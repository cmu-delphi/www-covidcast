<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import Options from '../../components/Options.svelte';
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
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    background: var(--bg);
  }

  .top-container {
    display: flex;
    justify-content: space-between;
  }

  .options-container {
    z-index: 1003;
    max-width: 50em;
    flex-grow: 3;
    margin: 0 6px;
  }

  .top-container > :global(.search-container) {
    flex-grow: 1;
    z-index: 1002;
    margin: 0 6px;
  }

  .content-container {
    flex: 1 1 0;
    display: flex;
  }

  .map-container {
    flex: 5 5 0;
    position: relative;
  }

  .panel-container {
    flex: 1 1 7rem;
    position: relative;
    margin: 0 6px;
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
</style>

<main class="root">
  <div class="top-container">
    <div class="options-container base-font-size container-bg container-style">
      <Options />
    </div>
    {#if !$isMobileDevice}
      <Search
        className="search-container container-bg container-style base-font-size"
        placeholder="Search for a location..."
        items={nameInfos}
        selectedItem={$currentRegionInfo}
        labelFieldName="displayName"
        maxItemsToShowInList="5"
        onChange={selectByInfo} />
    {/if}
  </div>
  <div class="content-container">
    <div class="map-container">
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

      {#if detailSensor != null && !$isMobileDevice}
        <div class="detail-container container-bg container-style">
          <DetailView sensor={detailSensor} on:close={() => (detailSensor = null)} />
        </div>
      {/if}
    </div>
    {#if !$isMobileDevice}
      <div class="panel-container container-bg container-style">
        <div class="panel-scroll-container">
          <SmallMultiplesPanel bind:detail={detailSensor} />
        </div>
      </div>
    {/if}
  </div>
</main>
