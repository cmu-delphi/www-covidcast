<script>
  import { onMount } from 'svelte';
  import MapBox from './MapBox.svelte';

  import {
    sensorMap,
    times,
    signalType,
    encoding,
    currentSensor,
    currentDate,
    currentLevel,
    currentRegion,
    currentRegionName,
    currentDataReadyOnMap,
    mounted,
  } from '../stores';
  import '../stores/urlHandler';
  import { updateTimeSliceCache, updateRegionSliceCache, loadMetaData } from '../data';

  // Fix for IE: https://stackoverflow.com/a/21712356
  let isIE = window.document.documentMode;

  let error = null;
  let graphShowStatus = false;
  let levelChangedWhenSensorChanged = false;
  let dateChangedWhenSensorChanged = false;
  let firstLoaded = true;

  // Since we don't want multiple updates, but currentSensor changes can update // the level and date, we have flags that prevent the async updates.
  currentSensor.subscribe((s) => {
    $currentDataReadyOnMap = false;

    if (!$mounted) {
      return;
    }

    let l = $currentLevel;
    let minDate = $times.get(s)[0],
      maxDate = $times.get(s)[1];
    let date = minDate;
    if ($currentDate >= minDate && $currentDate <= maxDate) {
      date = $currentDate;
    } else if ($currentDate > maxDate) {
      date = maxDate;
    }

    if (!$sensorMap.get(s).levels.includes($currentLevel)) {
      l = $sensorMap.get(s).levels[0];
      levelChangedWhenSensorChanged = true;
      currentRegion.set('');
      currentRegionName.set('');
      currentLevel.set(l);
    } else {
      updateTimeSliceCache(s, l, $currentRegion);
    }
    // reset encoding
    if (!s.match(/num/)) {
      // eslint-disable-next-line no-unused-vars
      $encoding = 'color';
    }
    if (date !== $currentDate) {
      dateChangedWhenSensorChanged = true;
      currentDate.set(date);
    }

    $sensorMap.get(s).official ? signalType.set('value') : '';

    updateRegionSliceCache(s, l, date, 'sensor-change');
  });

  currentLevel.subscribe((l) => {
    // eslint-disable-next-line no-unused-vars
    $currentDataReadyOnMap = false;

    if (levelChangedWhenSensorChanged) {
      levelChangedWhenSensorChanged = false;
      return;
    }
    if ($mounted) {
      currentRegion.set('');
      currentRegionName.set('');
    }
    if (!$mounted) {
      return;
    }
    updateRegionSliceCache($currentSensor, l, $currentDate, 'level-change');
  });

  currentDate.subscribe((d) => {
    if (dateChangedWhenSensorChanged) {
      dateChangedWhenSensorChanged = false;
    } else if ($mounted) {
      updateRegionSliceCache($currentSensor, $currentLevel, d, 'date-change');
    }
  });

  currentRegion.subscribe((r) => {
    if ($mounted) {
      updateTimeSliceCache($currentSensor, $currentLevel, r);
    }
    if (firstLoaded && r !== '') {
      toggleGraphShowStatus(null, false);
      firstLoaded = false;
    } else if (r) {
      toggleGraphShowStatus(null, true);
    } else {
      toggleGraphShowStatus(null, false);
    }
  });

  onMount(() => {
    loadMetaData().then(({ level, date }) => {
      $mounted = 1;
      updateRegionSliceCache($currentSensor, level, date);
      if ($currentRegion) {
        updateTimeSliceCache($currentSensor, $currentLevel, $currentRegion);
      }
    });
  });

  function toggleGraphShowStatus(event, to = null) {
    if (to !== null) {
      graphShowStatus = to;
    } else {
      graphShowStatus = !graphShowStatus;
    }
  }
</script>

<style>
  .error-message-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    color: gray;
  }
</style>

{#if error}
  <div class="error-message-container">Failed to load data. Please try again later...</div>
{/if}

<MapBox {isIE} {graphShowStatus} {toggleGraphShowStatus} />
