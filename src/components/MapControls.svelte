<script>
  import { encoding } from '../stores';
  import { trackEvent } from '../stores/ga';

  export let className = '';

  /**
   * @type {import('./MapBox/ZoomMap').default}
   */
  export let zoom;

  export let showEncodings = false;
  export let loading = false;
</script>

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
      }}
    />
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
      }}
    />
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
      }}
    />
  </div>
  {#if showEncodings}
    <div class="uk-vertical-button-group">
      <button
        aria-pressed={$encoding === 'color' ? 'true' : 'false'}
        class="uk-button uk-button-default uk-button-small choropleth"
        class:uk-active={$encoding === 'color'}
        data-uk-icon="icon: blank"
        on:click={() => {
          encoding.set('color');
        }}
        title="Switch to Choropleth"
      />
      <button
        aria-pressed={$encoding === 'bubble' ? 'true' : 'false'}
        class="uk-button uk-button-default uk-button-small bubble"
        class:uk-active={$encoding === 'bubble'}
        data-uk-icon="icon: blank"
        on:click={() => {
          encoding.set('bubble');
        }}
        title="Switch to Bubble Map"
      />
      <button
        aria-pressed={$encoding === 'spike' ? 'true' : 'false'}
        class="uk-button uk-button-default uk-button-small spike"
        class:uk-active={$encoding === 'spike'}
        data-uk-icon="icon: blank"
        on:click={() => {
          encoding.set('spike');
        }}
        title="Switch to Spike Map"
      />
    </div>
  {/if}
  {#if loading}
    <div class="loader loading" />
  {/if}
</div>

<style>
  .root {
    display: flex;
    flex-direction: column;
  }

  .root > div {
    margin-bottom: 6px;
  }

  .uk-button {
    background: white;
    padding: 0 4px;
  }

  .choropleth > :global(svg),
  .bubble > :global(svg),
  .spike > :global(svg) {
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }

  .choropleth > :global(svg) {
    background-image: url('../assets/imgs/choropleth_small.png');
  }
  .bubble > :global(svg) {
    background-image: url('../assets/imgs/bubble_small.png');
  }
  .spike > :global(svg) {
    background-image: url('../assets/imgs/spike_small.png');
  }

  .loader {
    min-width: 28px;
    min-height: 28px;
    overflow: hidden;
  }
</style>
