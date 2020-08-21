<script>
  import IoMdPause from 'svelte-icons/io/IoMdPause.svelte';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  // import { timeMonth } from 'd3-time';
  import noUiSlider from 'nouislider';
  import 'nouislider/distribute/nouislider.css';
  import { timeFormat } from 'd3-time-format';

  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  const dispatch = createEventDispatcher();

  const dateFormatter = timeFormat('%m/%d');
  const dateFullFormatter = timeFormat('%x');

  export let running = false;
  export let value = new Date();
  export let min = new Date();
  export let max = new Date();

  let playButton = null;

  function toggleRunning() {
    dispatch('toggle', !running);
  }

  function dateToDay(d) {
    return Math.floor(d.getTime()) / DAY_IN_MS;
  }

  function dayToDate(d) {
    return new Date(d * DAY_IN_MS);
  }

  /**
   * @type {KeyboardEvent} e
   */
  function onSpacePress(e) {
    if (e.key === ' ' && e.target !== playButton) {
      // in case we press space on the play button it will trigger a click
      toggleRunning();
    }
  }

  let sliderElement = null;
  let sliderInstance = null;

  const formatFull = {
    to: (v) => {
      return dateFullFormatter(dayToDate(v));
    },
    from: (v) => {
      return Number.parseInt(v, 10);
    },
  };

  const formatPip = {
    to: (v) => {
      const d = dayToDate(v);
      if (d.getTime() === min.getTime() || d.getTime() === max.getTime()) {
        return dateFullFormatter(d);
      }
      return dateFormatter(d);
    },
    from: (v) => {
      return Number.parseInt(v, 10);
    },
  };

  onMount(() => {
    sliderInstance = noUiSlider.create(sliderElement, {
      step: 1,
      tooltips: [formatFull],
      connect: 'lower',
      range: {
        min: dateToDay(min),
        max: dateToDay(max),
      },
      start: dateToDay(value),
      pips: {
        mode: 'positions',
        values: [0, 25, 50, 75, 100],
        density: 4,
        format: formatPip,
      },
    });
    sliderInstance.on('change', (values) => {
      dispatch('change', dayToDate(Number.parseInt(values[0], 10)));
    });
  });

  onDestroy(() => {
    if (sliderInstance) {
      sliderInstance.destroy();
      sliderInstance = null;
    }
  });

  $: {
    const v = dateToDay(value);
    if (sliderInstance) {
      sliderInstance.set(v);
    }
  }
  function updateSliderRange(min, max) {
    if (!sliderInstance) {
      return;
    }
    const minD = dateToDay(min);
    const maxD = dateToDay(max);
    sliderInstance.updateOptions(
      {
        range: { min: minD, max: maxD },
        start: dateToDay(value),
      },
      false,
    );
  }

  $: {
    updateSliderRange(min, max);
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
    background: var(--red) !important;
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
    bind:this={playButton}
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
