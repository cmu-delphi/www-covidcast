<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import {
    signalType,
    currentSensor,
    currentLevel,
    encoding,
    colorScale,
    colorStops,
    bubbleRadiusScale,
    spikeHeightScale,
    currentSensorEntry,
    currentDateObject,
    signalCasesOrDeathOptions,
  } from '../../stores';
  import MapOverlays from '../../components/MapOverlays.svelte';
  import { fetchRegionSlice } from '../../data/fetchData';

  /**
   * @type {MapBox}
   */
  let map;

  let ready = null;

  function initialReady() {
    setTimeout(() => {
      ready = 'ready';
    }, 500);
  }

  function updatedEncoding(info) {
    if (!info) {
      return;
    }
    if (info.scale) {
      colorScale.set(info.scale);
    }
    colorStops.set(info.stops);
    if ($encoding === 'bubble') {
      bubbleRadiusScale.set(info.custom);
    }
    if ($encoding === 'spike') {
      spikeHeightScale.set(info.custom);
    }
  }
  $: data = fetchRegionSlice($currentSensorEntry, $currentLevel, $currentDateObject);
</script>

<style>
  .root {
    position: relative;
    flex-grow: 1;
  }
</style>

<main class="root base-font-size" data-screenshot={ready}>
  <MapOverlays {map} mapLoading={false} legendLoading={false} interactive={false} />
  <MapBox
    bind:this={map}
    {data}
    sensor={$currentSensor}
    level={$currentLevel}
    signalType={$signalType}
    signalOptions={$signalCasesOrDeathOptions}
    encoding={$encoding}
    on:ready={() => initialReady()}
    interactive={false}
    on:updatedEncoding={(e) => updatedEncoding(e.detail)} />
</main>
