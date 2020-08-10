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
  import ToggleEncoding from '../../components/ToggleEncoding.svelte';
  import Title from '../../components/Title.svelte';
  import MapControls from '../../components/MapControls.svelte';
  import Search from '../../components/Search.svelte';
  import { isDeathSignal, isCasesSignal } from '../../data/signals';
  import { trackEvent } from '../../stores/ga';
  import Time from '../../components/Time.svelte';
  import GraphContainer from '../../components/Graph/GraphContainer.svelte';

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
  }

  .top-container {
    position: absolute;
    top: 10px;
    right: 12px;
    left: 12px;

    display: grid;
    grid-gap: 0.4em;
    grid-template-columns: auto 2fr 1fr auto;
    grid-template-rows: auto auto;
    grid-template-areas:
      'options options search controls'
      'toggle title title controls'
      'toggle title title controls';
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

  .options-container {
    z-index: 1003;
    max-width: 50em;
    grid-area: options;
  }

  .toggle-container {
    z-index: 1001;
    grid-area: toggle;
  }

  .title-container {
    z-index: 1001;
    grid-area: title;
    align-self: flex-start;
    justify-self: center;
    padding: 0.2em 1em;
  }

  .search-container-wrapper {
    grid-area: search;
    position: relative;
    min-width: 2.8em;
  }

  .search-container-wrapper > :global(*) {
    z-index: 1002;
    min-height: 100%;
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    .top-container {
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto auto;
      grid-template-areas:
        'options options options'
        'search title controls'
        'toggle title controls';
    }
  }

  /** desktop **/
  @media only screen and (min-width: 767px) {
    .title-container {
      background-color: unset;
      box-shadow: none;
    }
  }

  .map-controls-container {
    margin-left: 1em;
    z-index: 1001;
    grid-area: controls;
    display: flex;
    align-items: flex-start;
    height: 0;
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

  .time-container {
    position: absolute;
    bottom: 12px;
    right: 10px;
    z-index: 1002;
    padding: 30px 10px;
    box-sizing: border-box;
    transition: all 0.1s ease-in;
  }

  .hidden {
    display: none;
  }
</style>

<main class="root">
  <div class="top-container">
    <div class="options-container container-bg base-font-size container-style">
      <Options />
    </div>
    <div class="search-container-wrapper base-font-size" class:loading={$regionSearchList.length === 0}>
      {#if $regionSearchList.length > 0}
        <Search
          className="search-container container-bg container-style"
          placeholder="Search for a location..."
          items={$regionSearchList}
          selectedItem={$currentRegionInfo}
          labelFieldName="display_name"
          maxItemsToShowInList="5"
          onChange={selectByInfo} />
      {/if}
    </div>
    <div
      class="toggle-container container-bg base-font-size container-style"
      class:hidden={$signalType === 'direction' || !(isDeathSignal($currentSensor) || isCasesSignal($currentSensor))}>
      <ToggleEncoding />
    </div>
    <div class="title-container container-bg">
      <Title />
    </div>
    <div class="map-controls-container">
      <MapControls zoom={map ? map.zoom : null} />
    </div>
  </div>
  <div class="legend-container container-bg">
    <Legend />
  </div>

  <div class="time-container container-bg">
    <Time />
  </div>

  <GraphContainer {graphShowStatus} {toggleGraphShowStatus} />

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
</main>
