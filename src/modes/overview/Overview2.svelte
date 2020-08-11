<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import Legend from '../../components/Legend.svelte';
  import Options from '../../components/Options.svelte';
  import {
    signalType,
    currentDataReadyOnMap,
    currentData,
    currentSensor,
    currentLevel,
    encoding,
    currentZone,
    currentRange,
    colorScale,
    colorStops,
    bubbleRadiusScale,
    spikeHeightScale,
    regionSearchList,
    currentRegionInfo,
    currentRegion,
    selectByInfo,
    selectByFeature,
  } from '../../stores';
  import Title from '../../components/Title.svelte';
  import MapControls from '../../components/MapControls.svelte';
  import Search from '../../components/Search.svelte';
  import { trackEvent } from '../../stores/ga';
  import SmallMultiplesPanel from './SmallMultiplesPanel.svelte';

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
    currentRange.set(info.range);
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

  let graphShowStatus = false;
  let firstLoaded = true;

  currentRegion.subscribe((r) => {
    if (firstLoaded && r !== '') {
      toggleGraphShowStatus(null, false);
      firstLoaded = false;
    } else if (r) {
      toggleGraphShowStatus(null, true);
    } else {
      toggleGraphShowStatus(null, false);
    }
  });
  function toggleGraphShowStatus(event, to = null) {
    if (to !== null) {
      graphShowStatus = to;
    } else {
      graphShowStatus = !graphShowStatus;
    }
    trackEvent('graph', graphShowStatus ? 'show' : 'hide');
  }
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 80vh;
    min-height: 550px;
    display: flex;
    flex-direction: column;
  }

  :global(.container-bg) {
    /* rounded design refresh */
    border-radius: 7px;
    background-color: #ffffff;
    box-shadow: 0px 4px 10px rgba(151, 151, 151, 0.25);
  }

  :global(.container-style) {
    padding: 8px 8px;
    box-sizing: border-box;
    transition: all 0.1s ease-in;
    font-family: 'Open Sans', Helvetica, sans-serif !important;
  }

  .top-container {
    padding: 0 12px;
    display: flex;
    justify-content: space-between;
  }

  .options-container {
    z-index: 1003;
    max-width: 50em;
    flex-grow: 3;
  }

  .search-container-wrapper {
    position: relative;
    min-width: 2.8em;
    flex-grow: 1;
  }

  .search-container-wrapper > :global(*) {
    z-index: 1002;
    min-height: 100%;
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
  }

  .panel-scroll-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .map-top-overlay {
    display: flex;
  }

  .map-controls-container {
    margin-left: 1em;
    margin-right: 0.2em;
    z-index: 1001;
    display: flex;
    align-items: flex-start;
    height: 0;
  }

  .title-container {
    flex: 1 1 0;
    z-index: 1001;
    align-self: flex-start;
    justify-self: center;
    padding: 0.2em 1em;
  }

  /** desktop **/
  @media only screen and (min-width: 767px) {
    .title-container {
      background-color: unset;
      box-shadow: none;
    }
  }

  .legend-container {
    position: absolute;
    bottom: 12px;
    left: 10px;
    z-index: 1000;
    /*height: 105px;*/
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    transition: all 0.1s ease-in;
  }
</style>

<main class="root">
  <div class="top-container container-style">
    <div class="options-container base-font-size">
      <Options />
    </div>
    <div class="search-container-wrapper base-font-size" class:loading={$regionSearchList.length === 0}>
      {#if $regionSearchList.length > 0}
        <Search
          className="search-container"
          placeholder="Search for a location..."
          items={$regionSearchList}
          selectedItem={$currentRegionInfo}
          labelFieldName="display_name"
          maxItemsToShowInList="5"
          onChange={selectByInfo} />
      {/if}
    </div>
  </div>
  <div class="content-container">
    <div class="map-container">
      <div class="map-top-overlay">
        <div class="title-container container-bg">
          <Title />
        </div>
        <div class="map-controls-container">
          <MapControls zoom={map ? map.zoom : null} showEncodings />
        </div>
      </div>
      <div class="legend-container container-bg">
        <Legend />
      </div>
      <MapBox
        bind:this={map}
        on:idle={() => currentDataReadyOnMap.set(true)}
        data={$currentData}
        sensor={$currentSensor}
        level={$currentLevel}
        signalType={$signalType}
        selection={$currentRegionInfo}
        encoding={$encoding}
        on:ready={() => initialReady()}
        on:updatedEncoding={(e) => updatedEncoding(e.detail)}
        on:select={(e) => selectByFeature(e.detail)}
        on:selectMega={(e) => selectByFeature(e.detail)} />
    </div>
    <div class="panel-container">
      <div class="panel-scroll-container">
        <SmallMultiplesPanel />
      </div>
    </div>
  </div>
</main>
