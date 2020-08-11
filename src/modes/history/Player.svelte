<script>
  import IoMdPause from 'svelte-icons/io/IoMdPause.svelte';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { timeMonth } from 'd3';
  import noUiSlider from 'nouislider';
  import 'nouislider/distribute/nouislider.css';

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

  let sliderElement = null;
  let sliderInstance = null;

  const format = {
    to: (v) => {
      return new Date(v).toLocaleDateString();
    },
    from: (v) => {
      return Number.parseInt(v);
    },
  };

  onMount(() => {
    sliderInstance = noUiSlider.create(sliderElement, {
      step: DAY_IN_MS,
      tooltips: [format],
      connect: 'lower',
      range: {
        min: min.getTime(),
        max: max.getTime(),
      },
      start: value.getTime(),
      pips: {
        mode: 'values',
        format,
        values: timeMonth.range(min, max, 2).map((d) => d.getTime()),
        density: 4,
        stepped: true,
      },
    });
    sliderInstance.on('change', (values) => {
      dispatch('change', new Date(Number.parseInt(values[0], 10)));
    });
  });

  onDestroy(() => {
    if (sliderInstance) {
      sliderInstance.destroy();
      sliderInstance = null;
    }
  });

  $: {
    const v = value.getTime();
    if (sliderInstance) {
      sliderInstance.set(v);
    }
  }
  $: {
    const minD = min.getTime();
    const maxD = max.getTime();
    if (sliderInstance) {
      sliderInstance.updateOptions(
        {
          range: { min: minD, max: maxD },
          start: value.getTime(),
          pips: {
            mode: 'values',
            format,
            values: timeMonth.range(min, max, 2).map((d) => d.getTime()),
            density: 4,
            stepped: true,
          },
        },
        false,
      );
    }
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
    color: whitesmoke;
  }
  .play-button:active {
    outline: none;
  }

  .slider {
    margin: 0.5em 1em 1.5em 2.5em;
    flex: 1 1 20em;
    height: 8px;
    font-size: 0.75rem;
  }

  .slider :global(.noUi-connect) {
    background: var(--red);
  }

  .slider :global(.noUi-tooltip) {
    display: none;
  }
  .slider :global(.noUi-active .noUi-tooltip) {
    display: block;
  }
  .slider :global(.noUi-pips-horizontal) {
    padding: 3px 0;
  }
  .slider :global(.noUi-marker-horizontal.noUi-marker-large) {
    height: 10px;
  }

  .slider :global(.noUi-handle) {
    border-radius: 50%;
    background: var(--red);
    width: 20px;
    height: 20px;
    top: -7px;
    right: -10px;
    box-shadow: none;
  }

  .slider :global(.noUi-handle)::before,
  .slider :global(.noUi-handle)::after {
    display: none;
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svelte-c8tyih">
        <path d="M140 52v408l320-204L140 52z" />
      </svg>
    {/if}
  </button>
  <div bind:this={sliderElement} class="slider" />
</div>

<svelte:window on:keydown={onSpacePress} />
