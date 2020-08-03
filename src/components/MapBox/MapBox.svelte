<script>
  import { onMount, onDestroy } from 'svelte';
  import { levelMegaCounty } from '../../stores/constants';
  import {
    bubbleRadiusScale,
    colorScale,
    colorStops,
    currentData,
    currentLevel,
    currentRange,
    currentSensor,
    currentZone,
    encoding,
    signalType,
    spikeHeightScale,
    stats,
  } from '../../stores';
  import { determineColorScale, determineMinMax } from './colors';
  import { generateDataLookup } from './data';
  import MapBoxWrapper from './MapBoxWrapper';
  import { S } from './sources';

  /**
   * @type {HTMLElement | null}
   */
  let container = null;

  const wrapper = new MapBoxWrapper();

  export const zoom = wrapper.zoom;

  $: showCurrentZone = $currentZone === 'swpa';
  $: drawMega = $currentLevel === 'county';

  let ready = false;

  onMount(() => {
    wrapper.initMap(container, showCurrentZone).then(() => {
      // update date init
      ready = true;
    });
  });

  // Update the map when sensor or level changes.
  // currentData.subscribe(() => updateMap('data'));
  // currentLevel.subscribe(() => {
  //   labelStates();
  //   updateMap('data');
  // });
  // signalType.subscribe(() => {
  //   updateMap('signal');
  // });
  // encoding.subscribe(() => updateMap('encoding'));
  // mounted.subscribe(() => updateMap('mounted'));
  // currentDate.subscribe(() => {
  //   if (
  //     $currentData.length > 0 &&
  //     ($currentData[0].sensor !== $currentSensor || $currentData[0].level !== $currentLevel)
  //   ) {
  //     return;
  //   }
  //   updateMap('data');
  // });

  function updateEncoding(level, encoding, sensor, signalType, stats) {
    // Get the range for the heatmap.
    const valueMinMax = determineMinMax(stats, sensor, level);
    currentRange.set(signalType === 'value' ? valueMinMax : [-1, 1]);
    const { stops, stopsMega, scale } = determineColorScale(valueMinMax, signalType, sensor);
    if (scale) {
      // store the color scale (used for tooltips and legend)
      colorScale.set(scale);
    }
    // update store
    colorStops.set(stops);

    const drawMega = level === 'county';
    const ret = wrapper.updateOptions(encoding, level, signalType, sensor, valueMinMax, stops, drawMega && stopsMega);
    // post encoding logic
    if (encoding === 'bubble') {
      bubbleRadiusScale.set(ret);
    } else if (encoding === 'spike') {
      spikeHeightScale.set(ret);
    }
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

  $: mapData = generateDataLookup($currentData, $currentSensor, drawMega, ready);
  $: {
    // update mega
    if (drawMega) {
      updateMegaSources(mapData.geoIds, mapData.mega.value, mapData.mega.direction, $currentSensor, true);
    }
  }
  $: {
    // update levels
    updateLevelSources(mapData.geoIds, $currentLevel, mapData.value, mapData.direction, $currentSensor, true);
  }
  $: {
    // update encodings upon change
    if ($stats) {
      updateEncoding($currentLevel, $encoding, $currentSensor, $signalType, $stats);
    }
  }

  // function updateMap(type) {
  //   if (!mapMounted) return;

  //   // If we're looking at counties, draw the mega-county states.
  //   let drawMega = $currentLevel === 'county';

  //   const updateData = ['data', 'init'].includes(type);

  //   const viableFeatures = dat.features.filter((f) => f.properties[$signalType] !== MISSING_VALUE);

  //   // set a random focus on start up
  //   if (chosenRandom === false && $mounted) {
  //     if (viableFeatures.length > 0) {
  //       const found = viableFeatures.filter(
  //         (f) =>
  //           f.properties.id === defaultRegionOnStartup.county ||
  //           f.properties.id === defaultRegionOnStartup.msa ||
  //           f.properties.id === defaultRegionOnStartup.state,
  //       );
  //       if (found.length > 0) {
  //         // found Allegheny / Pittsburgh
  //         const randomFeature = found[0];
  //         if ($currentRegion === '') {
  //           currentRegionName.set(randomFeature.properties.NAME);
  //           currentRegion.set(randomFeature.id);
  //           clickedId = randomFeature.id;
  //           setFeatureStateMultiple([S.bubble, S.spike.fill, S.spike.stroke], clickedId, {
  //             select: true,
  //           });
  //         }
  //         chosenRandom = true;
  //       } else {
  //         const index = Math.floor(Math.random() * (viableFeatures.length - 1));
  //         const randomFeature = viableFeatures[index];
  //         currentRegionName.set(randomFeature.properties.NAME);
  //         currentRegion.set(randomFeature.properties.id);

  //         clickedId = randomFeature.id;
  //         setFeatureStateMultiple([S.bubble, S.spike.fill, S.spike.stroke], clickedId, {
  //           select: true,
  //         });
  //         chosenRandom = true;
  //       }
  //     }
  //   }

  //   if ($currentRegion) {
  //     const megaFound = megaDat.features.find((f) => f.properties.STATE + '000' === $currentRegion + '');
  //     const found = viableFeatures.find((f) => f.properties.id === $currentRegion);
  //     if (megaFound) {
  //       megaClickedId = parseInt(megaFound.properties.STATE);
  //       currentRegionName.set(megaFound.properties.NAME);
  //       map.setFeatureState({ source: S['mega-county'].border, id: megaClickedId }, { select: true });
  //     }
  //     if (found) {
  //       clickedId = found.id;
  //       currentRegionName.set(found.properties.NAME);
  //       setFeatureStateMultiple([S.bubble, S.spike.fill, S.spike.stroke], clickedId, {
  //         select: true,
  //       });
  //     }
  //   }
  // }

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
