<script>
  import Title from './Title.svelte';
  import MapControls from './MapControls.svelte';
  import Legend from './Legend.svelte';
  import './mapContainer.css';

  export let map = null;
  export let mapLoading = true;
  export let legendLoading = true;
</script>

<style>
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

<div class="map-top-overlay">
  <div class="title-container container-bg">
    <Title>
      <slot name="title" />
    </Title>
  </div>
  <div class="map-controls-container">
    <MapControls zoom={map ? map.zoom : null} showEncodings loading={mapLoading} />
  </div>
</div>
<div class="legend-container container-bg container-style">
  <Legend loading={legendLoading} />
</div>
