<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import Options from '../../components/Options.svelte';
  import {
    signalType,
    currentDataReadyOnMap,
    currentData,
    currentSensor,
    currentLevel,
    encoding,
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
  import Search from '../../components/Search.svelte';
  import SmallMultiplesPanel from './SmallMultiplesPanel.svelte';
  import SmallMultiplesDetail from './SmallMultiplesDetail.svelte';
  import MapOverlays from './MapOverlays.svelte';
  import USMapBoxWrapper from '../../components/MapBox/USMapBoxWrapper';

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

  /**
   * @type {import('../../data/fetchData').SensorEntry | null}
   */
  let detailSensor = null;

  function onShow(e) {
    detailSensor = e.detail;
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
  <div class="top-container container-style">
    <div class="options-container base-font-size container-bg container-style">
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
  </div>
  <div class="content-container">
    <div class="map-container">
      <MapOverlays {map} />
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
        on:selectMega={(e) => selectByFeature(e.detail)}
        wrapperClass={USMapBoxWrapper} />

      {#if detailSensor != null}
        <div class="detail-container container-bg container-style">
          <SmallMultiplesDetail sensor={detailSensor} on:close={() => (detailSensor = null)} />
        </div>
      {/if}
    </div>
    <div class="panel-container">
      <div class="panel-scroll-container">
        <SmallMultiplesPanel on:show={onShow} detail={detailSensor} />
      </div>
    </div>
  </div>
</main>
