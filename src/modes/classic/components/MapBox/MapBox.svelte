<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { stats } from '../../../../stores';
  import { determineColorScale, determineMinMax } from './colors';
  import { primaryValue, sensorMap } from '../../../../stores/constants';

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
  export let data = Promise.resolve([]);
  export let sensor = '';
  export let level = 'state';
  export let encoding = 'color';
  export let signalOptions = {};
  export let animationDuration = 0;
  export let title = '';
  /**
   * @type {{info: import('../../maps/nameIdInfo').NameInfo, color: string}[]}
   */
  export let selections = [];

  /**
   * @type {import('../../maps').NameInfo | null}
   */
  export let focusOn = null;

  let ready = false;

  onMount(() => {
    wrapper.animationDuration = animationDuration;
    wrapper.initMap(container, title).then(() => {
      ready = true;
    });
  });

  function dummyTrack() {
    // dummy function to mark a given argument as tracked
  }

  function updateEncoding(level, encoding, sensor, stats, signalOptions) {
    // Get the range for the heatmap.
    const sensorEntry = sensorMap.get(sensor);
    const sensorType = sensorEntry.getType(signalOptions);
    const valueMinMax = determineMinMax(stats, sensorEntry, level, signalOptions);
    const { stops, scale } = determineColorScale(valueMinMax, sensorEntry, sensorType);
    const drawMega = level === 'county';
    const ret = wrapper.updateOptions(
      encoding,
      level,
      sensor,
      sensorType,
      valueMinMax,
      stops,
      drawMega && stops,
      scale,
    );
    dispatch('updatedEncoding', {
      range: valueMinMax,
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
      updateEncoding(level, encoding, sensor, $stats, signalOptions);
    }
  }
  $: {
    dummyTrack(ready);
    // update selection
    wrapper.selectMulti(selections);
  }

  $: {
    dummyTrack(ready);
    wrapper.focusOn(focusOn);
  }

  $: {
    wrapper.setTitle(title);
  }

  function onResize() {
    wrapper.zoom.resized();
  }

  onDestroy(() => {
    wrapper.destroy();
  });
</script>

<div class="map-wrapper" bind:this={container} />
<svelte:window on:resize={onResize} />

<style>
  .map-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
</style>
