<script>
  import { currentZone, currentLevel, encoding, currentSensor, signalType } from '../stores';
  import IoMdAdd from 'svelte-icons/io/IoMdAdd.svelte';
  import IoMdRemove from 'svelte-icons/io/IoMdRemove.svelte';
  import IoMdHome from 'svelte-icons/io/IoMdHome.svelte';
  import TiTag from 'svelte-icons/ti/TiTag.svelte';
  import Loading from './Loading.svelte';
  import { trackEvent } from '../stores/ga';
  import { isDeathSignal, isCasesSignal } from '../data';

  export let className = '';

  /**
   * @type {import('./MapBox/ZoomMap').default}
   */
  export let zoom;

  export let showEncodings = false;
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
  }

  .root > div {
    margin-bottom: 0.2em;
  }

  .encoding-button {
    background-size: 80%;
    background-position: center;
    background-repeat: no-repeat;
    color: transparent;
  }

  .choropleth {
    background-image: url('../assets/imgs/choropleth.png');
  }
  .bubble {
    background-image: url('../assets/imgs/bubble.png');
  }
  .spike {
    background-image: url('../assets/imgs/spike.png');
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

  {#if showEncodings && $signalType !== 'direction' && (isDeathSignal($currentSensor) || isCasesSignal($currentSensor))}
    <div class="pg-button-vertical-group">
      <button
        aria-pressed={$encoding === 'color' ? 'true' : 'false'}
        class="pg-button encoding-button choropleth"
        class:selected={$encoding === 'color'}
        on:click={() => {
          encoding.set('color');
        }}
        title="Switch to Choropleth">
        <span aria-hidden>Switch to Choropleth</span>
        <IoMdHome />
      </button>
      <button
        aria-pressed={$encoding === 'bubble' ? 'true' : 'false'}
        class="pg-button encoding-button bubble"
        class:selected={$encoding === 'bubble'}
        on:click={() => {
          encoding.set('bubble');
        }}
        title="Switch to Bubble Map">
        <span aria-hidden>Switch to Bubble Map</span>
        <IoMdHome />
      </button>
      <button
        aria-pressed={$encoding === 'spike' ? 'true' : 'false'}
        class="pg-button encoding-button spike"
        class:selected={$encoding === 'spike'}
        on:click={() => {
          encoding.set('spike');
        }}
        title="Switch to Spike Map">
        <span aria-hidden>Switch to Spike Map</span>
        <IoMdHome />
      </button>
    </div>
  {/if}

  <Loading />
</div>
