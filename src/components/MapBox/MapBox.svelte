<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { levelMegaCounty } from '../../stores/constants';
  import { stats } from '../../stores';
  import { determineColorScale, determineMinMax } from './colors';
  import { generateDataLookup } from './data';
  import MapBoxWrapper from './MapBoxWrapper';
  import { S } from './sources';

  /**
   * @type {HTMLElement | null}
   */
  let container = null;

  const dispatch = createEventDispatcher();
  const wrapper = new MapBoxWrapper((event, data) => dispatch(event, data));

  export const zoom = wrapper.zoom;

  export function selectRandom() {
    wrapper.selectRandom();
  }

  export let data = [];
  export let sensor = '';
  export let level = 'state';
  export let encoding = 'color';
  export let signalType = 'value';
  export let showCurrentZone = false;
  /**
   * @type {import('../../maps/nameIdInfo').NameInfo | null}
   */
  export let selection = null;

  $: drawMega = level === 'county';

  let ready = false;

  onMount(() => {
    wrapper.initMap(container, showCurrentZone).then(() => {
      ready = true;
    });
  });

  function dummyTrack() {
    // dummy function to mark a given argument as tracked
  }

  function updateEncoding(level, encoding, sensor, signalType, stats) {
    // Get the range for the heatmap.
    const valueMinMax = determineMinMax(stats, sensor, level);
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

  function updateMegaSources(geoIds, values, directions, sensor, updateData) {
    const idCheck = (props) => {
      const id = props.STATE;
      const megaId = id + '000';

      if (!geoIds.has(megaId)) {
        return null;
      }
      return id;
    };
    wrapper.updateSource(S[levelMegaCounty.id].border, values, directions, sensor, updateData, idCheck);
  }

  function updateLevelSources(geoIds, level, values, directions, sensor, updateData) {
    const idCheck = (props) => {
      const id = props.id;
      if (!geoIds.has(id)) {
        return null;
      }
      return id;
    };
    wrapper.updateSource(S[level].border, values, directions, sensor, updateData, idCheck);
    wrapper.updateSource(S[level].center, values, directions, sensor, updateData, idCheck);
  }

  $: mapData = generateDataLookup(data, sensor, drawMega);
  $: {
    // update mega
    dummyTrack(ready);
    if (drawMega) {
      updateMegaSources(mapData.geoIds, mapData.mega.value, mapData.mega.direction, sensor, true);
    }
  }
  $: {
    dummyTrack(ready);
    // update levels
    updateLevelSources(mapData.geoIds, level, mapData.value, mapData.direction, sensor, true);
  }
  $: {
    dummyTrack(ready);
    // update encodings upon change
    if ($stats) {
      updateEncoding(level, encoding, sensor, signalType, $stats);
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
