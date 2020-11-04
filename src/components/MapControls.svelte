<script>
  import { encoding, isValueSignalType } from '../stores';
  import { trackEvent } from '../stores/ga';

  export let className = '';

  /**
   * @type {import('./MapBox/ZoomMap').default}
   */
  export let zoom;

  export let showEncodings = false;
  export let loading = false;
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
  }

  .root > div {
    margin-bottom: 0.2em;
  }

  .uk-button {
    background: white;
    padding: 0 4px;
  }

  .encoding-button {
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }

  .choropleth {
    background-image: url('../assets/imgs/choropleth_small.png');
  }
  .bubble {
    background-image: url('../assets/imgs/bubble_small.png');
  }
  .spike {
    background-image: url('../assets/imgs/spike_small.png');
  }

  .loader {
    min-width: 28px;
    min-height: 28px;
    overflow: hidden;
  }
</style>

<div class="root {className}">
  <div class="uk-vertical-button-group">
    <button
      class="uk-button uk-button-default uk-button-small"
      data-uk-icon="icon: plus"
      type="button"
      title="Zoom in"
      aria-label="Zoom in"
      disabled={!zoom || zoom.getZoom() <= zoom.getMinZoom()}
      on:click={() => {
        trackEvent('map', 'zoomIn');
        zoom.zoomIn();
      }} />
    <button
      class="uk-button uk-button-default uk-button-small"
      data-uk-icon="icon: minus"
      type="button"
      title="Zoom out"
      aria-label="Zoom out"
      disabled={!zoom || zoom.getZoom() >= zoom.getMaxZoom()}
      on:click={() => {
        trackEvent('map', 'zoomOut');
        zoom.zoomOut();
      }} />
  </div>
  <div>
    <button
      class="uk-button uk-button-default uk-button-small"
      type="button"
      data-uk-icon="icon: home"
      title="Show entire map"
      aria-label="Show entire map"
      disabled={!zoom}
      on:click={() => {
        trackEvent('map', 'zoomReset');
        zoom.resetZoom();
      }} />
  </div>
  {#if showEncodings && $isValueSignalType}
    <div class="uk-vertical-button-group">
      <button
        aria-pressed={$encoding === 'color' ? 'true' : 'false'}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={$encoding === 'color'}
        data-uk-icon="icon: dummy"
        on:click={() => {
          encoding.set('color');
        }}
        title="Switch to Choropleth">
        <svg width="20" height="20" viewBox="0 0 20 20" class="encoding-button choropleth" />
      </button>
      <button
        aria-pressed={$encoding === 'bubble' ? 'true' : 'false'}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={$encoding === 'bubble'}
        data-uk-icon="icon: dummy"
        on:click={() => {
          encoding.set('bubble');
        }}
        title="Switch to Bubble Map">
        <svg width="20" height="20" viewBox="0 0 20 20" class="encoding-button bubble" />
      </button>
      <button
        aria-pressed={$encoding === 'spike' ? 'true' : 'false'}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={$encoding === 'spike'}
        data-uk-icon="icon: dummy"
        on:click={() => {
          encoding.set('spike');
        }}
        title="Switch to Spike Map">
        <svg width="20" height="20" viewBox="0 0 20 20" class="encoding-button spike" />
      </button>
    </div>
  {/if}
  {#if loading}
    <div class="loader loading" />
  {/if}
</div>
