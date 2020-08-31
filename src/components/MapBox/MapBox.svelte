<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { stats, sensorMap } from '../../stores';
  import { determineColorScale, determineMinMax } from './colors';
  import MapBoxWrapper from './MapBoxWrapper';
  import { ChoroplethEncoding, BubbleEncoding, SpikeEncoding } from './encodings';
  import { ENCODING_BUBBLE_THEME, ENCODING_SPIKE_THEME } from '../../theme';
  import { primaryValue } from '../../stores/constants';

  /**
   * @type {HTMLElement | null}
   */
  let container = null;

  const dispatch = createEventDispatcher();
  const wrapper = new MapBoxWrapper((event, data) => dispatch(event, data), [
    new ChoroplethEncoding(),
    new BubbleEncoding(ENCODING_BUBBLE_THEME),
    new SpikeEncoding(ENCODING_SPIKE_THEME),
  ]);

  export const zoom = wrapper.zoom;

  export function selectRandom() {
    wrapper.selectRandom();
  }
  export let data = Promise.resolve([]);
  export let sensor = '';
  export let level = 'state';
  export let encoding = 'color';
  export let signalType = 'value';
  export let signalOptions = {};
  export let animationDuration = 0;
  /**
   * @type {import('../../maps/nameIdInfo').NameInfo | null}
   */
  export let selection = null;

  $: drawMega = level === 'county';

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

  function updateEncoding(level, encoding, sensor, signalType, stats, signalOptions) {
    // Get the range for the heatmap.
    const sensorEntry = sensorMap.get(sensor);
    const valueMinMax = determineMinMax(stats, sensorEntry, level, signalOptions);
    const { stops, stopsMega, scale } = determineColorScale(valueMinMax, signalType, sensorEntry);
    const drawMega = level === 'county';
    const ret = wrapper.updateOptions(
      encoding,
      level,
      signalType,
      sensor,
      valueMinMax,
      stops,
      drawMega && stopsMega,
      scale,
    );
    dispatch('updatedEncoding', {
      range: signalType === 'value' ? valueMinMax : [-1, 1],
      custom: ret,
      scale,
      stops,
    });
  }

  $: {
    // update mega
    wrapper.updateSources(level, data, primaryValue(sensorMap.get(sensor), signalOptions));
  }
  $: {
    dummyTrack(ready);
    // update encodings upon change
    if ($stats) {
      updateEncoding(level, encoding, sensor, signalType, $stats, signalOptions);
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
