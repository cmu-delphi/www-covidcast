<script>
  import MapBox from './MapBox/MapBox.svelte';
  import {
    currentSensor,
    currentLevel,
    encoding,
    colorScale,
    colorStops,
    bubbleRadiusScale,
    spikeHeightScale,
    currentRegion,
    signalCasesOrDeathOptions,
    currentSensorMapTitle,
  } from '../../../stores';
  import { createEventDispatcher } from 'svelte';
  import USMapBoxWrapper from './MapBox/USMapBoxWrapper';
  import MapOverlays from './MapOverlays.svelte';

  const dispatch = createEventDispatcher();
  /**
   * @type {MapBox}
   */
  let map;

  let zoom = 1.0;

  export let mapLoading = false;
  export let legendLoading = false;
  export let summary = null;
  export let showDate = false;

  export let data;
  /**
   * @type {{info: import('../../maps/nameIdInfo').NameInfo, color: string}[]}
   */
  export let selections = [];

  /**
   * @type {import('../../maps').NameInfo | null}
   */
  export let focusOn = null;
  export let selectRandomOnReady = false;

  function updatedEncoding(info) {
    if (!info) {
      return;
    }
    if (info.scale) {
      colorScale.set(info.scale);
    }
    colorStops.set(info.stops);
    if ($encoding === 'bubble' && info.custom) {
      bubbleRadiusScale.set(info.custom);
    }
    if ($encoding === 'spike' && info.custom) {
      spikeHeightScale.set(info.custom);
    }
  }

  function initialReady() {
    if (!$currentRegion && selectRandomOnReady) {
      map.selectRandom();
    }
  }
</script>

<MapOverlays {map} {mapLoading} {legendLoading} {zoom} {summary} {showDate} />
<MapBox
  bind:this={map}
  {data}
  sensor={$currentSensor}
  level={$currentLevel}
  signalOptions={$signalCasesOrDeathOptions}
  {selections}
  {focusOn}
  encoding={$encoding}
  on:zoom={(e) => (zoom = e.detail)}
  on:updatedEncoding={(e) => updatedEncoding(e.detail)}
  on:loading={(e) => dispatch('loading', e.detail)}
  on:select={(e) => dispatch('select', e.detail)}
  on:ready={initialReady}
  wrapperClass={USMapBoxWrapper}
  title={$currentSensorMapTitle}
/>
