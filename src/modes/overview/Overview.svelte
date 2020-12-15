<script>
  import { levelList } from '../../stores';
  import USMapBoxWrapper from '../../components/MapBox/USMapBoxWrapper';
  import { nameInfos } from '../../maps';
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import Options from '../../components/Options.svelte';
  import {
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
  import AddAnother from './AddAnother.svelte';
  import { getInfoByName } from '../../maps';

  export let wrapperClass = USMapBoxWrapper;
  export let regionSearchList = nameInfos;

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
  /**
   * the id to focus the map on
   * only be set when the user searches for something
   * @type {import('../../maps').NameInfo | null}
   */
  let focusOn = null;
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
    margin: 0 6px;
  }

  .search-container {
    grid-area: search;
    z-index: 1009;
    margin: 0 6px;
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
    background: white;
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
    padding: 0 4px;
  }

  .map-button > :global(svg) {
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url('../../assets/imgs/choropleth_small.png');
  }

  .chart-button {
    color: #8c8c8c;
    padding: 0 4px;
  }

  .hiddenPanel {
    grid-template-areas:
      'options search view'
      'map map map';
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
    <div class="search-container container-bg container-style">
      <Search
        placeholder="Search for a location..."
        items={regionSearchList}
        selectedItem={$currentRegionInfo}
        labelFieldName="displayName"
        maxItemsToShowInList="5"
        on:change={(e) => {
          if (selectByInfo(e.detail)) {
            focusOn = e.detail || null;
          }
          trackEvent('search', 'select', e.detail ? e.detail.id : '');
        }} />
    </div>

    <div class="view-switcher">
      {#if !$isMobileDevice}
        <button
          aria-pressed={String(!desktopShowPanel)}
          class="uk-button uk-button-default chart-button single-toggle"
          on:click={() => {
            trackEvent('overview', 'show-panel', String(!desktopShowPanel));
            desktopShowPanel = !desktopShowPanel;
          }}
          title="{desktopShowPanel ? 'Hide' : 'Show'} Line Charts panel"
          data-uk-icon="icon: {desktopShowPanel ? 'chart-line-ban' : 'chart-line'}" />
      {:else}
        <div class="uk-button-group">
          <button
            aria-pressed={String(mobileShowMap)}
            class="uk-button uk-button-default map-button"
            class:uk-active={mobileShowMap}
            on:click={() => {
              trackEvent('overview', 'show-map', 'true');
              mobileShowMap = true;
            }}
            title="Switch to Map"
            data-uk-icon="icon: blank" />
          <button
            aria-pressed={String(!mobileShowMap)}
            class="uk-button uk-button-default chart-button"
            class:uk-active={!mobileShowMap}
            on:click={() => {
              trackEvent('overview', 'show-map', 'false');
              mobileShowMap = false;
            }}
            title="Switch to Line Charts"
            data-uk-icon="icon: chart-line" />
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
      signalOptions={$signalCasesOrDeathOptions}
      {selections}
      {focusOn}
      encoding={$encoding}
      on:ready={() => initialReady()}
      on:zoom={(e) => (zoom = e.detail)}
      on:updatedEncoding={(e) => updatedEncoding(e.detail)}
      on:select={(e) => {
        if (focusOn != null) {
          focusOn = null;
        }
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
        <button
          class="uk-button uk-button-default uk-button-small"
          on:click={() => currentCompareSelection.set(showCompare ? null : [])}>
          {showCompare ? 'Exit' : 'Open'}
          compare mode
        </button>
      </div>
    </div>
  {/if}
  {#if showCompare}
    <div class="add-container">
      <div class="selection-container container-bg container-style">
        <ul class="uk-list uk-list-square uk-margin-remove">
          {#each selections as selection}
            <li class="selection-legend" style="color: {selection.color}">
              <button
                class="selection-toolbar uk-icon-button uk-icon-button-small"
                on:click={() => removeCompare(selection.info)}
                data-uk-icon="icon: close; ratio: 0.8"
                title="Remove selected" />
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
