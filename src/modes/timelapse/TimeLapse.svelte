<script>
  import MapBox from '../../components/MapBox/MapBox.svelte';
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
    signalCasesOrDeathOptions,
  } from '../../stores';
  import Player from './Player.svelte';
  import { timeDay } from 'd3-time';
  import { parseAPITime, formatAPITime } from '../../data';
  import { fetchRegionSlice } from '../../data/fetchData';
  import { trackEvent } from '../../stores/ga';
  import USMapBoxWrapper from '../../components/MapBox/USMapBoxWrapper';
  import { onMount } from 'svelte';
  import MapOverlays from '../../components/MapOverlays.svelte';
  import modes from '..';
  import SingleModeToggle from '../../components/SingleModeToggle.svelte';

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
      : new Date(2020, 1, 1);
  $: maxDate =
    $times != null && $times.has($currentSensorEntry.key)
      ? parseAPITime($times.get($currentSensorEntry.key)[1])
      : new Date(2020, 8, 1);

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
      dataBuffer.set(key, fetchRegionSlice($currentSensorEntry, $currentLevel, toLoad));
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
    paramChange($currentSensorEntry, $currentLevel, $signalCasesOrDeathOptions);
  }
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    display: grid;
    background: var(--bg);
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'options player'
      'map map';
  }

  .root > :global(.options-container) {
    grid-area: options;
  }

  .root > :global(.player-container) {
    grid-area: player;
    z-index: 1003;
  }

  .map-container {
    grid-area: map;
    position: relative;
  }

  .mode-container {
    position: absolute;
    margin: 6px;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    .root {
      display: flex;
      flex-direction: column;
    }
    .map-container {
      flex-grow: 1;
    }
    .root > :global(.player-container) {
      order: 3;
      margin-bottom: 6px;
    }
    .root > :global(.options-container) {
      margin-bottom: 6px;
    }
  }
</style>

<main class="root">
  <Options showDate={false} className="options-container" />
  <Player
    className="player-container"
    {running}
    on:toggle={toggleRunning}
    value={$currentDateObject}
    max={maxDate}
    min={minDate}
    on:change={(e) => jumpToDate(e.detail)} />
  <div class="map-container">
    <MapOverlays {map} mapLoading={running || loading} legendLoading={false}>
      <div slot="title">{$currentDateObject.toLocaleDateString()}</div>
    </MapOverlays>
    <div class="mode-container container-bg container-style">
      <SingleModeToggle mode={modes[0]} label="Back" />
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
      signalOptions={$signalCasesOrDeathOptions}
      on:updatedEncoding={(e) => updatedEncoding(e.detail)}
      wrapperClass={USMapBoxWrapper} />
  </div>
</main>
