<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
  import Legend from '../../components/Legend.svelte';
  import Options from '../../components/Options.svelte';
  import {
    signalType,
    currentSensor,
    currentLevel,
    encoding,
    colorScale,
    colorStops,
    bubbleRadiusScale,
    spikeHeightScale,
    currentDateObject,
    currentSensorEntry,
    times,
    currentDate,
    signalShowCumulative,
  } from '../../stores';
  import ToggleEncoding from '../../components/ToggleEncoding.svelte';
  import Title from '../../components/Title.svelte';
  import MapControls from '../../components/MapControls.svelte';
  import { isDeathSignal, isCasesSignal } from '../../data/signals';
  import Player from './Player.svelte';
  import { timeDay } from 'd3';
  import { parseAPITime, formatAPITime } from '../../data';
  import { fetchRegionSlice } from '../../data/fetchData';
  import { trackEvent } from '../../stores/ga';
  import { onMount } from 'svelte';

  /**
   * @type {MapBox}
   */
  let map;

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

  const FRAME_RATE = 250; // ms
  const MAX_BUFFER_CACHE = 7;

  let bufferCache = 3;
  /**
   * @type {Map<string, Promise<any>}
   */
  const dataBuffer = new Map();

  let nextFrameTimeout = -1;
  let running = false;

  let loading = true;
  let mapLoadedResolver = () => undefined;
  let currentData = Promise.resolve([]);

  $: minDate =
    $times != null && $times.has($currentSensorEntry.key)
      ? parseAPITime($times.get($currentSensorEntry.key)[0])
      : timeDay.offset(timeDay.floor($currentDateObject), -1);
  $: maxDate =
    $times != null && $times.has($currentSensorEntry.key)
      ? parseAPITime($times.get($currentSensorEntry.key)[1])
      : $currentDateObject;

  /**
   * @param {Date} date
   */
  function getData(date) {
    const key = `${date}-${$currentSensorEntry.key}-${$currentLevel}`;
    // check data buffer
    if (dataBuffer.has(key)) {
      const r = dataBuffer.get(key);
      dataBuffer.delete(r); // delece since used
      return r;
    }
    return fetchRegionSlice($currentSensorEntry, $currentLevel, date);
  }

  /**
   * @param {Date} date
   */
  function prefetchData(date) {
    let maxCache = timeDay.offset(date, bufferCache);
    if (maxCache > maxDate) {
      maxCache = maxDate;
    }
    const dates = timeDay.range(timeDay.floor(date), maxCache);
    for (const toLoad of dates) {
      const key = `${toLoad}-${$currentSensorEntry.key}-${$currentLevel}`;
      if (dataBuffer.has(key)) {
        continue;
      }
      dataBuffer.set(key, fetchRegionSlice($currentSensorEntry, $currentLevel, date));
    }
  }

  function showFrame(date, playNext = false) {
    nextFrameTimeout = -1;

    if (!playNext) {
      running = false;
      currentData = getData(date);
      currentData.then(() => {
        // update visual date once the data is loaded but not yet shown
        currentDate.set(formatAPITime(date));
      });
      return;
    }

    const nextDate = timeDay.offset(date, 1);
    // fetch data
    prefetchData(date);
    const mapLoaded = new Promise((resolve) => (mapLoadedResolver = resolve));
    const started = Date.now();
    currentData = getData(date);
    // let dataNeeded = -1;
    currentData.then(() => {
      // dataNeeded = Date.now() - started;
      // update visual date once the data is loaded but not yet shown
      currentDate.set(formatAPITime(date));
    });
    mapLoaded.then(() => {
      if (!running) {
        return;
      }
      const needed = Date.now() - started;
      // console.log(needed, dataNeeded, needed - dataNeeded);
      if (needed > FRAME_RATE && bufferCache < MAX_BUFFER_CACHE) {
        // increase buffer if it was too slow
        bufferCache++;
      }
      nextFrameTimeout = setTimeout(() => {
        showFrame(nextDate, nextDate < maxDate);
      }, Math.max(0, FRAME_RATE - needed));
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
      dataBuffer.clear();
      return;
    }
    trackEvent('player', 'start');
    // start
    if (maxDate.getTime() === $currentDateObject.getTime()) {
      // auto reset
      showFrame(minDate, true);
    } else {
      // tick next day
      showFrame(timeDay.offset($currentDateObject, 1), true);
    }
  }

  function jumpToDate(d) {
    if (running) {
      // stop upon manual jump
      toggleRunning();
    }
    trackEvent('player', 'jump', d.toString());
    showFrame(d, false);
  }

  function paramChange() {
    // if the user changes the sensor or level we stop and load just the frame
    if (running) {
      toggleRunning();
    }
    showFrame($currentDateObject, false);
  }

  onMount(() => {
    showFrame($currentDateObject, false);
  });

  $: {
    const sensor = $currentSensorEntry;
    const level = $currentLevel;
    paramChange(sensor, level);
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
      <MapControls zoom={map ? map.zoom : null} {loading} />
    </div>
  </div>
  <div class="legend-container container-bg">
    <Legend loading={false} />
  </div>
  <MapBox
    bind:this={map}
    on:loading={(e) => {
      loading = e.detail;
      if (!e.detail) {
        mapLoadedResolver();
      }
    }}
    data={currentData}
    sensor={$currentSensor}
    level={$currentLevel}
    signalType={$signalType}
    encoding={$encoding}
    showCumulative={$signalShowCumulative}
    on:updatedEncoding={(e) => updatedEncoding(e.detail)} />
</main>
