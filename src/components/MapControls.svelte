<script>
  import { createEventDispatcher } from 'svelte';
  import { currentZone } from '../stores';
  import IoMdAdd from 'svelte-icons/io/IoMdAdd.svelte';
  import IoMdRemove from 'svelte-icons/io/IoMdRemove.svelte';
  import IoMdHome from 'svelte-icons/io/IoMdHome.svelte';

  const dispatch = createEventDispatcher();
  export let className = '';

  // zoom info for disabling zoom
  export let zoom = 0;
  export let maxZoom = Number.POSITIVE_INFINITY;
  export let minZoom = Number.NEGATIVE_INFINITY;
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
      disabled={zoom <= minZoom}
      on:click={() => {
        dispatch('zoomIn');
      }}>
      <IoMdAdd />
    </button>
    <button
      class="pg-button"
      type="button"
      title="Zoom out"
      aria-label="Zoom out"
      disabled={zoom >= maxZoom}
      on:click={() => {
        dispatch('zoomOut');
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
      on:click={() => {
        dispatch('reset');
      }}>
      <IoMdHome />
    </button>
  </div>
  {#if $currentZone.length > 0}
    <div>
      <button
        class="pg-button"
        type="button"
        title="show swpa boundary"
        aria-label="show swpa boundary"
        on:click={() => {
          dispatch('swpa');
        }}>
        SWPA
      </button>
    </div>
  {/if}
</div>
