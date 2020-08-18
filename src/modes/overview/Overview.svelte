<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import Legend from '../../components/Legend.svelte';
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
    regionSearchList,
    currentRegionInfo,
    currentRegion,
    selectByInfo,
    selectByFeature,
    currentSensorEntry,
    signalShowCumulative,
    currentDateObject,
  } from '../../stores';
  import ToggleEncoding from '../../components/ToggleEncoding.svelte';
  import Title from '../../components/Title.svelte';
  import MapControls from '../../components/MapControls.svelte';
  import Search from '../../components/Search.svelte';
  import LineSmallMultiples from '../../components/LineSmallMultiples.svelte';
  import { fetchRegionSlice } from '../../data/fetchData';

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

  let loading = true;
  $: data = fetchRegionSlice($currentSensorEntry, $currentLevel, $currentDateObject);
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

    display: flex;
    align-items: flex-start;
  }

  .top-left-container {
    flex: 1 1 0;
    display: grid;
    grid-gap: 0.4em;
    grid-template-columns: auto 2fr 1fr auto;
    grid-template-rows: auto auto;
    grid-template-areas:
      'options options search'
      'toggle title title';
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
    .top-left-container {
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto auto;
      grid-template-areas:
        'options options options'
        'search title'
        'toggle title';
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
    <div class="top-left-container">

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
            labelFieldName="displayName"
            maxItemsToShowInList="5"
            onChange={selectByInfo} />
        {/if}
      </div>
      <div
        class="toggle-container container-bg base-font-size container-style"
        class:hidden={$signalType === 'direction' || !$currentSensorEntry.isCasesOrDeath}>
        <ToggleEncoding />
      </div>
      <div class="title-container container-bg">
        <Title />
      </div>
    </div>
    <div class="map-controls-container">
      <MapControls zoom={map ? map.zoom : null} {loading} />
    </div>
  </div>
  <div class="legend-container container-bg">
    <Legend {loading} />
  </div>

  <div class="small-multiples">
    <LineSmallMultiples />
  </div>

  <MapBox
    bind:this={map}
    on:loading={(e) => (loading = e.detail)}
    {data}
    sensor={$currentSensor}
    level={$currentLevel}
    signalType={$signalType}
    showCumulative={$signalShowCumulative}
    selection={$currentRegionInfo}
    encoding={$encoding}
    on:ready={() => initialReady()}
    on:updatedEncoding={(e) => updatedEncoding(e.detail)}
    on:select={(e) => selectByFeature(e.detail)}
    on:selectMega={(e) => selectByFeature(e.detail)} />
</main>
