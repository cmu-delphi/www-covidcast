<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { stats } from '../../stores';
  import { determineColorScale, determineMinMax } from './colors';

  /**
   * @type {{new(): import('./AMapBoxWrapper').default}}
   */
  export let wrapperClass;
  /**
   * @type {HTMLElement | null}
   */
  let container = null;

  const dispatch = createEventDispatcher();

  const wrapper = new wrapperClass((event, data) => dispatch(event, data));

  export const zoom = wrapper.zoom;

  export function selectRandom() {
    wrapper.selectRandom();
  }
  export let data = [];
  export let sensor = '';
  export let level = 'state';
  export let encoding = 'color';
  export let signalType = 'value';
  export let showCumulative = false;
  export let animationDuration = 0;
  /**
   * @type {import('../../maps/nameIdInfo').NameInfo | null}
   */
  export let selection = null;

  let ready = false;

  onMount(() => {
    wrapper.animationDuration = animationDuration;
    wrapper.initMap(container).then(() => {
      ready = true;
    });
  });

  function dummyTrack() {
    // dummy function to mark a given argument as tracked
  }

  function updateEncoding(level, encoding, sensor, signalType, stats, showCumulative) {
    // Get the range for the heatmap.
    const valueMinMax = determineMinMax(stats, sensor, level, showCumulative);
    const { stops, stopsMega, scale } = determineColorScale(valueMinMax, signalType, sensor);
    const drawMega = level === 'county';
    const ret = wrapper.updateOptions(encoding, level, signalType, sensor, valueMinMax, stops, drawMega && stopsMega);
    dispatch('updatedEncoding', {
      range: signalType === 'value' ? valueMinMax : [-1, 1],
      custom: ret,
      scale,
      stops,
    });
  }

  $: {
    // update mega
    dummyTrack(ready);
    wrapper.updateSources(level, data, showCumulative ? 'avgCumulative' : 'value');
  }
  $: {
    dummyTrack(ready);
    // update encodings upon change
    if ($stats) {
      updateEncoding(level, encoding, sensor, signalType, $stats, showCumulative);
    }
  }
  $: {
    dummyTrack(ready);
    // update selection
    wrapper.select(selection);
  }

  function onResize() {
    wrapper.zoom.resized();
  }

  onDestroy(() => {
    wrapper.destroy();
  });
</script>

<style>
  .map-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
</style>

<div class="map-wrapper" bind:this={container} />
<svelte:window on:resize={onResize} />
