<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  // import LineSmallMultiples from '../../components/LineSmallMultiples.svelte';
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
    currentRegion,
    currentRegionInfo,
    currentRegionName,
  } from '../../stores';
  import Toggle from '../../components/Toggle.svelte';
  import Title from '../../components/Title.svelte';
  import MapControls from '../../components/MapControls.svelte';
  import { trackEvent } from '../../stores/ga';
  import Search from '../../components/Search.svelte';

  /**
   * @type {MapBox}
   */
  let map;

  function select(feature) {
    const id = feature ? feature.properties.id : null;
    console.log('select', feature, id);
  }
  function selectMega(feature) {
    const id = feature ? feature.properties.STATE + '000' : null;
    console.log('selectMega', feature, id);
  }
  /**
   * @param {import('../../maps/nameIdInfo').NameInfo | null} elem
   */
  function searchElement(elem) {
    if (elem === $currentRegionInfo) {
      return;
    }
    // the info is derived
    if (elem) {
      currentRegion.set(elem.id);
      currentRegionName.set(elem.display_name);
    } else {
      currentRegion.set('');
      currentRegionName.set('');
    }
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
          onChange={searchElement} />
      {/if}
    </div>
    <div
      class="toggle-container container-bg base-font-size container-style"
      class:hidden={$signalType === 'direction'}>
      <!-- !$currentSensor.match(/num/)-->
      <Toggle />
    </div>
    <div class="title-container container-bg">
      <Title />
    </div>
    <div class="map-controls-container">
      <MapControls
        zoom={map ? map.zoom.getZoom() : 0}
        maxZoom={map ? map.zoom.getMaxZoom() : 100}
        minZoom={map ? map.zoom.getMinZoom() : -100}
        on:zoomIn={() => {
          trackEvent('map', 'zoomIn');
          map.zoom.zoomIn();
        }}
        on:zoomOut={() => {
          trackEvent('map', 'zoomOut');
          map.zoom.zoomOut();
        }}
        on:reset={() => {
          trackEvent('map', 'fitUS');
          map.zoom.resetZoom();
        }}
        on:hideLabels={() => {
          trackEvent('map', 'toggleStateLabel');
          map.zoom.toggleStateLabels();
        }}
        on:swpa={() => {
          trackEvent('map', 'fitSWPA');
          map.zoom.fitSWPA();
        }} />
    </div>
  </div>
  <div class="legend-container container-bg">
    <Legend />
  </div>

  <div class="small-multiples">
    <!-- <LineSmallMultiples /> -->
  </div>

  <MapBox
    bind:this={map}
    on:idle={() => currentDataReadyOnMap.set(true)}
    data={$currentData}
    sensor={$currentSensor}
    level={$currentLevel}
    signalType={$signalType}
    showCurrentZone={$currentZone === 'swpa'}
    encoding={$encoding}
    on:range={(e) => currentRange.set(e.detail)}
    on:colorScale={(e) => colorScale.set(e.detail)}
    on:colorStops={(e) => colorStops.set(e.detail)}
    on:bubbleScale={(e) => bubbleRadiusScale.set(e.detail)}
    on:spikeScale={(e) => spikeHeightScale.set(e.detail)}
    on:select={(e) => select(e.detail)}
    on:selectMega={(e) => selectMega(e.detail)} />
</main>
