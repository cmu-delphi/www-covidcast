<script>
  import { currentZone, currentLevel } from '../stores';
  import IoMdAdd from 'svelte-icons/io/IoMdAdd.svelte';
  import IoMdRemove from 'svelte-icons/io/IoMdRemove.svelte';
  import IoMdHome from 'svelte-icons/io/IoMdHome.svelte';
  import TiTag from 'svelte-icons/ti/TiTag.svelte';
  import Loading from './Loading.svelte';
  import { trackEvent } from '../stores/ga';

  export let className = '';

  /**
   * @type {import('./MapBox/ZoomMap').default}
   */
  export let zoom;
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
  }

  .root > div {
    margin-bottom: 0.2em;
  }
</style>

<div class="root base-font-size {className}">
  <div class="pg-button-vertical-group">
    <button
      class="pg-button"
      type="button"
      title="Zoom in"
      aria-label="Zoom in"
      disabled={!zoom || zoom.getZoom() <= zoom.getMinZoom()}
      on:click={() => {
        trackEvent('map', 'zoomIn');
        zoom.zoomIn();
      }}>
      <IoMdAdd />
    </button>
    <button
      class="pg-button"
      type="button"
      title="Zoom out"
      aria-label="Zoom out"
      disabled={!zoom || zoom.getZoom() >= zoom.getMaxZoom()}
      on:click={() => {
        trackEvent('map', 'zoomOut');
        zoom.zoomOut();
      }}>
      <IoMdRemove />
    </button>
  </div>
  <div>
    <button
      class="pg-button"
      type="button"
      title="Show entire map"
      aria-label="Show entire map"
      disabled={!zoom}
      on:click={() => {
        trackEvent('map', 'fitUS');
        zoom.resetZoom();
      }}>
      <IoMdHome />
    </button>
  </div>
  {#if $currentLevel == 'state'}
    <div>
      <button
        class="pg-button"
        type="button"
        title="Hide state labels"
        aria-label="Hide state labels"
        disabled={!zoom}
        on:click={() => {
          trackEvent('map', 'toggleStateLabel');
          zoom.toggleStateLabels();
        }}>
        <TiTag />
      </button>
    </div>
  {/if}
  {#if $currentZone.length > 0}
    <div>
      <button
        class="pg-button"
        type="button"
        title="show swpa boundary"
        aria-label="show swpa boundary"
        disabled={!zoom}
        on:click={() => {
          trackEvent('map', 'fitSWPA');
          zoom.showSWPA();
        }}>
        SWPA
      </button>
    </div>
  {/if}
  <Loading />
</div>
