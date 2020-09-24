<script>
  import Title from './Title.svelte';
  import MapControls from './MapControls.svelte';
  import { isDirectionSignalType, encoding, currentSensorEntry } from '../stores';
  import EncodingOptions from './EncodingOptions.svelte';
  import DirectionLegend from './legends/DirectionLegend.svelte';
  import ColorLegend from './legends/ColorLegend.svelte';
  import BubbleLegend from './legends/BubbleLegend.svelte';
  import SpikeLegend from './legends/SpikeLegend.svelte';

  export let map = null;
  export let mapLoading = true;
  export let legendLoading = true;
  export let zoom = 1.0;
</script>

<style>
  .map-top-overlay {
    display: flex;
  }

  .map-controls-container {
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
    font-weight: 600;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .signal-description {
    margin-bottom: 0.25em;
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
  }
</style>

<div class="map-top-overlay">
  <div class="title-container">
    <Title />
  </div>
  <div class="map-controls-container">
    <MapControls zoom={map ? map.zoom : null} showEncodings loading={mapLoading} />
  </div>
</div>
<div class="legend-container base-font-size" aria-label="map legend">
  <EncodingOptions sensor={$currentSensorEntry} className="container-bg container-style encoding-wrapper" />
  <div class="container-bg container-style">
    <div class="signal-description" />

    {#if $isDirectionSignalType}
      <DirectionLegend />
    {:else if $encoding === 'color'}
      <ColorLegend loading={legendLoading} />
    {:else if $encoding === 'bubble'}
      <BubbleLegend loading={legendLoading} {zoom} />
    {:else if $encoding === 'spike'}
      <SpikeLegend loading={legendLoading} {zoom} />
    {/if}
  </div>
</div>
