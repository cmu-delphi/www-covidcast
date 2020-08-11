<script>
  import IoMdPlay from 'svelte-icons/io/IoMdPlay.svelte';
  import IoMdPause from 'svelte-icons/io/IoMdPause.svelte';
  import { createEventDispatcher } from 'svelte';

  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  const dispatch = createEventDispatcher();

  export let running = false;
  export let value = new Date();
  export let min = new Date();
  export let max = new Date();

  function toggleRunning() {
    dispatch('toggle', !running);
  }

  /**
   * @type {KeyboardEvent} e
   */
  function onSpacePress(e) {
    if (e.key === ' ') {
      toggleRunning();
    }
  }

  /**
   * @type {ChangeEvent} e
   */
  function onChange(e) {
    const n = e.currentTarget.valueAsNumber;
    dispatch('change', new Date(n));
  }
</script>

<style>
  .player {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    padding: 0 0.5em;
  }

  .play-button {
    flex: 0 0 auto;
    padding: 0.4rem;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    line-height: 1;
    position: relative;
    border: none;
    background: var(--red);
    border-radius: 50%;
    color: white;
    box-sizing: border-box;
  }

  .play-button:hover,
  .play-button:focus {
    outline: none !important;
    color: var(--grey);
  }
  .play-button:active {
    outline: none;
  }

  .slider {
    -webkit-appearance: none;
    width: unset;
    flex: 1 1 20em;
    height: 6px;
    padding: 0;
    border: none;
    background: #d3d3d3;
    outline: none;
    margin: 12px;
  }

  .slider::-moz-focus-outer {
    border: 0;
  }

  /* Special styling for WebKit/Blink */
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--red);
    cursor: pointer;
  }

  /* All the same stuff for Firefox */
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--red);
    cursor: pointer;
  }

  /* All the same stuff for IE */
  .slider::-ms-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #c00;
    cursor: pointer;
  }
</style>

<div class="player">
  <button
    aria-pressed={running ? 'true' : 'false'}
    title={running ? 'Stop timeline to a specific date' : 'Play timeline to see how data changes over time'}
    class="play-button"
    on:click={toggleRunning}>
    {#if running}
      <IoMdPause />
    {:else}
      <IoMdPlay />
    {/if}
  </button>
  <input
    type="range"
    min={min.getTime()}
    max={max.getTime()}
    step={DAY_IN_MS}
    class="slider"
    value={value.getTime()}
    on:change={onChange} />
</div>

<svelte:window on:keydown={onSpacePress} />
