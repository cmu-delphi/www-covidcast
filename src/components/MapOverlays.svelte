<script>
  import Title from './Title.svelte';
  import MapControls from './MapControls.svelte';
  import { encoding, currentSensorEntry } from '../stores';
  import EncodingOptions from './EncodingOptions.svelte';
  import ColorLegend from './legends/ColorLegend.svelte';
  import BubbleLegend from './legends/BubbleLegend.svelte';
  import SpikeLegend from './legends/SpikeLegend.svelte';
  import MapSummary from './MapSummary.svelte';

  export let map = null;
  export let mapLoading = true;
  export let legendLoading = true;
  export let zoom = 1.0;
  export let showDate = false;
  export let summary = null;
</script>

<div class="map-top-overlay">
  <div class="title-container container-bg">
    <Title {showDate} />
  </div>
  <div class="map-controls-container">
    <MapControls zoom={map ? map.zoom : null} showEncodings loading={mapLoading} />
  </div>
</div>
<div class="legend-container base-font-size" aria-label="map legend">
  <EncodingOptions sensor={$currentSensorEntry} className="container-bg container-style encoding-wrapper" />
  <div class="container-bg container-style legend-scale" class:loading-bg={legendLoading}>
    {#if $encoding === 'color'}
      <ColorLegend />
    {:else if $encoding === 'bubble'}
      <BubbleLegend {zoom} />
    {:else if $encoding === 'spike'}
      <SpikeLegend {zoom} />
    {/if}
  </div>
</div>
<div class="summary-container" aria-label="map data summary">
  <MapSummary {summary} />
</div>

<style>
  .map-top-overlay {
    display: flex;
  }

  .map-controls-container {
    margin: 0;
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
    margin: 0;
    padding: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  /** desktop **/
  @media only screen and (min-width: 767px) {
    .title-container {
      box-shadow: none;
      border: none;
    }

    .map-controls-container {
      margin: 6px 6px 0 0;
    }
  }

  .legend-container {
    position: absolute;
    margin: 0.25em;
    left: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 100%;
  }

  .legend-container > :global(.encoding-wrapper) {
    margin-bottom: 6px;
    background: white;
  }

  .legend-scale {
    background: white;
  }

  .summary-container {
    position: absolute;
    margin: 0.25em;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
</style>
