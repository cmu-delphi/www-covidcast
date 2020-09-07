<script>
  import Title from './Title.svelte';
  import MapControls from './MapControls.svelte';
  import './mapContainer.css';
  import { isDirectionSignalType, encoding, currentSensorEntry } from '../stores';
  import EncodingOptions from './EncodingOptions.svelte';
  import DirectionLegend from './legends/DirectionLegend.svelte';
  import ColorLegend from './legends/ColorLegend.svelte';
  import BubbleLegend from './legends/BubbleLegend.svelte';
  import SpikeLegend from './legends/SpikeLegend.svelte';

  export let map = null;
  export let mapLoading = true;
  export let legendLoading = true;
  export let interactive = true;
  export let downloadHandler = null;
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
    padding: 0.5em 1em;
    margin: 0 6px;
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
    margin: 6px;
    left: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .legend-container > :global(.encoding-wrapper) {
    margin-bottom: 6px;
  }
</style>

<div class="map-top-overlay">
  <div class="title-container container-bg">
    <Title>
      <slot name="title" />
    </Title>
  </div>
  {#if interactive}
    <div class="map-controls-container">
      <MapControls zoom={map ? map.zoom : null} showEncodings loading={mapLoading} {downloadHandler} />
    </div>
  {/if}
</div>
<div class="legend-container base-font-size">
  {#if interactive}
    <EncodingOptions sensor={$currentSensorEntry} className="container-bg container-style encoding-wrapper" />
  {/if}
  <div class="container-bg container-style">
    {#if $isDirectionSignalType}
      <DirectionLegend />
    {:else if $encoding === 'color'}
      <ColorLegend loading={legendLoading} />
    {:else if $encoding === 'bubble'}
      <BubbleLegend loading={legendLoading} />
    {:else if $encoding === 'spike'}
      <SpikeLegend loading={legendLoading} />
    {/if}
  </div>
</div>
