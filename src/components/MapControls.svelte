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

  .pg-button {
    width: 2.2em;
    padding: 0.2em;
    box-sizing: border-box;

    position: relative;
    color: #333;
    display: flex;
    text-align: center;
    align-items: center;
    justify-content: center;

    cursor: pointer;
    text-decoration: none;
    user-select: none;

    transition-delay: 0s;
    transition-duration: 0.15s;
    transition-property: background-color;
    transition-timing-function: ease-in-out;

    /* rounded design refresh */
    border: 2px solid #dedede;
    border-radius: 4px;
    background-color: #ffffff;
  }

  .pg-button:disabled {
    cursor: not-allowed;
  }

  .button-group > button:first-of-type {
    border-bottom: none;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }
  .button-group > button:last-of-type {
    border-top-right-radius: 0;
    border-top-left-radius: 0;
    border-top-width: 1px;
  }

  .pg-button:focus {
    outline: none;
  }

  .pg-button:hover {
    background-color: #f2f2f2;
  }
</style>

<div class="root base-font-size {className}">
  <div class="button-group">
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
