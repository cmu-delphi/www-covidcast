<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import Legend from '../../components/Legend.svelte';
  import Options from '../../components/Options.svelte';
  import {
    signalType,
    currentDataReadyOnMap,
    currentData,
    currentSensor,
    currentLevel,
    encoding,
    currentRange,
    colorScale,
    colorStops,
    bubbleRadiusScale,
    spikeHeightScale,
    currentDateObject,
    currentSensorEntry,
    times,
    currentDate,
  } from '../../stores';
  import ToggleEncoding from '../../components/ToggleEncoding.svelte';
  import Title from '../../components/Title.svelte';
  import MapControls from '../../components/MapControls.svelte';
  import { isDeathSignal, isCasesSignal } from '../../data/signals';
  import Player from './Player.svelte';
  import { timeDay } from 'd3';
  import { parseAPITime, formatAPITime } from '../../data';
  import { fetchRegionSlice, clearRegionCache } from '../../data/fetchData';
  import { trackEvent } from '../../stores/ga';

  /**
   * @type {MapBox}
   */
  let map;

  function updatedEncoding(info) {
    if (!info) {
      return;
    }
    currentRange.set(info.range);
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

  let running = false;

  $: minDate =
    $times != null && $times.has($currentSensorEntry.key)
      ? parseAPITime($times.get($currentSensorEntry.key)[0])
      : timeDay.offset(timeDay.floor($currentDateObject), -1);
  $: maxDate =
    $times != null && $times.has($currentSensorEntry.key)
      ? parseAPITime($times.get($currentSensorEntry.key)[1])
      : $currentDateObject;

  const frameRate = 250; // ms
  let bufferCache = 3;
  const maxBufferCache = 7;
  const bufferedEstimate = new Set();
  const currentlyBufferingEstimate = new Set();

  let nextFrameTimeout = -1;

  function tick() {
    nextFrameTimeout = -1;
    const nextDate = timeDay.offset($currentDateObject, 1);
    if (nextDate > maxDate) {
      // end
      running = false;
      return;
    }
    const data = fetchRegionSlice($currentSensorEntry, $currentLevel, nextDate);
    // need to wait
    const started = Date.now();
    data.then(() => {
      if (!running) {
        return;
      }
      const needed = Date.now() - started;
      if (needed > frameRate && bufferCache < maxBufferCache) {
        // increase buffer if it was too slow
        bufferCache++;
      }
      nextFrameTimeout = setTimeout(() => {
        currentDate.set(formatAPITime(nextDate));
        tick();
      }, Math.max(0, frameRate - needed));
    });
  }

  function toggleRunning() {
    running = !running;
    if (!running) {
      trackEvent('player', 'stop');
      // stop
      if (nextFrameTimeout >= 0) {
        clearTimeout(nextFrameTimeout);
        nextFrameTimeout = -1;
      }
      clearRegionCache();
      return;
    }
    trackEvent('player', 'start');
    // start
    if (maxDate.getTime() === $currentDateObject.getTime()) {
      // auto reset
      currentDate.set(formatAPITime(minDate.getTime()));
    }
    clearRegionCache();
    tick();
  }
  function jumpToDate(d) {
    if (running) {
      // stop upon manual jump
      toggleRunning();
    }
    trackEvent('player', 'jump', d.toString());
    currentDate.set(formatAPITime(d));
  }

  function fetchDate(date, sensor, level) {
    const key = `${date}-${sensor.key}-${level}`;
    if (bufferedEstimate.has(key)) {
      return;
    }
    if (currentlyBufferingEstimate.size >= maxBufferCache) {
      return;
    }
    currentlyBufferingEstimate.add(key);
    bufferedEstimate.add(key);
    fetchRegionSlice(sensor, level, date).then(() => {
      // mark done
      currentlyBufferingEstimate.delete(key);
    });
  }

  $: {
    // fetch buffer size upon date change
    const date = $currentDateObject;
    const sensor = $currentSensorEntry;
    const level = $currentLevel;
    const dates = timeDay.range(timeDay.floor(date), timeDay.offset(date, bufferCache));
    for (const d of dates) {
      // delay for other promises to resolve
      setTimeout(() => fetchDate(d, sensor, level), 1);
    }
    // clear caches of old dates and different sensor entries
    const old = timeDay.offset(timeDay.floor(date), -2);
    clearRegionCache((key, keyF) => {
      const start = keyF(sensor, level, '');
      if (!key.startsWith(start)) {
        // different level or sensor
        return true;
      }
      const keyDate = parseAPITime(key.slice(start.length));
      // delete if time is two days behind the current frame
      return keyDate <= old;
    });
  }
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 80vh;
    min-height: 550px;
  }

  .top-container {
    position: absolute;
    top: 10px;
    right: 12px;
    left: 12px;

    display: flex;
    align-items: flex-start;
  }

  :global(.container-bg) {
    /* rounded design refresh */
    border-radius: 7px;
    background-color: #ffffff;
    box-shadow: 0px 4px 10px rgba(151, 151, 151, 0.25);
  }

  :global(.container-style) {
    padding: 8px 8px;
    box-sizing: border-box;
    transition: all 0.1s ease-in;
    font-family: 'Open Sans', Helvetica, sans-serif !important;
  }

  .top-left-container {
    flex: 1 1 0;
    display: grid;
    grid-gap: 0.4em;
    grid-template-columns: auto 1fr 1fr;
    grid-template-rows: auto auto;
    grid-template-areas:
      'options options player'
      'toggle title title';
  }

  .options-container {
    z-index: 1003;
    max-width: 50em;
    grid-area: options;
  }

  .player-container {
    z-index: 1003;
    max-width: 50em;
    grid-area: player;
    display: flex;
  }

  .toggle-container {
    z-index: 1001;
    grid-area: toggle;
  }

  .title-container {
    z-index: 1001;
    grid-area: title;
    align-self: flex-start;
    justify-self: center;
    padding: 0.2em 1em;
  }

  /** desktop **/
  @media only screen and (min-width: 767px) {
    .title-container {
      background-color: unset;
      box-shadow: none;
    }
  }

  .map-controls-container {
    margin-left: 1em;
    z-index: 1001;
    display: flex;
    align-items: flex-start;
    height: 0;
  }

  .legend-container {
    position: absolute;
    bottom: 12px;
    left: 10px;
    z-index: 1000;
    /*height: 105px;*/
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    transition: all 0.1s ease-in;
  }

  .hidden {
    display: none;
  }
</style>

<main class="root">
  <div class="top-container">
    <div class="top-left-container">
      <div class="options-container container-bg base-font-size container-style">
        <Options showDate={false} />
      </div>
      <div
        class="toggle-container container-bg base-font-size container-style"
        class:hidden={$signalType === 'direction' || !(isDeathSignal($currentSensor) || isCasesSignal($currentSensor))}>
        <ToggleEncoding />
      </div>
      <div class="title-container container-bg">
        <Title>
          <br />
          {$currentDateObject.toLocaleDateString()}
        </Title>
      </div>
      <div class="player-container container-bg container-style base-font-size ">
        <Player
          {running}
          on:toggle={toggleRunning}
          value={$currentDateObject}
          max={maxDate}
          min={minDate}
          on:change={(e) => jumpToDate(e.detail)} />
      </div>
    </div>
    <div class="map-controls-container">
      <MapControls zoom={map ? map.zoom : null} />
    </div>
  </div>
  <div class="legend-container container-bg">
    <Legend />
  </div>
  <MapBox
    bind:this={map}
    animationDuration={frameRate}
    on:idle={() => currentDataReadyOnMap.set(true)}
    data={$currentData}
    sensor={$currentSensor}
    level={$currentLevel}
    signalType={$signalType}
    encoding={$encoding}
    on:updatedEncoding={(e) => updatedEncoding(e.detail)} />
</main>
