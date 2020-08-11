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
  import { fetchRegionSlice } from '../../data/fetchData';

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
      : $currentDateObject;
  $: maxDate =
    $times != null && $times.has($currentSensorEntry.key)
      ? parseAPITime($times.get($currentSensorEntry.key)[1])
      : $currentDateObject;

  const frameRate = 250;
  let bufferCache = 3;

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
      if (needed > frameRate) {
        // increase buffer if it was too slow
        bufferCache = Math.min(bufferCache + 1, 10);
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
      // stop
      if (nextFrameTimeout >= 0) {
        clearTimeout(nextFrameTimeout);
        nextFrameTimeout = -1;
      }
      return;
    }
    // start
    if (maxDate.getTime() === $currentDateObject.getTime()) {
      // auto reset
      currentDate.set(formatAPITime(minDate.getTime()));
    }
    tick();
  }
  function jumpToDate(d) {
    if (running) {
      // stop upon manual jump
      toggleRunning();
    }
    currentDate.set(formatAPITime(d));
  }

  $: {
    // fetch buffer size upon date change
    const date = $currentDateObject;
    const dates = timeDay.range(timeDay.floor(date), timeDay.offset(date, bufferCache));
    for (const d of dates) {
      fetchRegionSlice($currentSensorEntry, $currentLevel, d);
    }
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
    on:idle={() => currentDataReadyOnMap.set(true)}
    data={$currentData}
    sensor={$currentSensor}
    level={$currentLevel}
    signalType={$signalType}
    encoding={$encoding}
    on:updatedEncoding={(e) => updatedEncoding(e.detail)} />
</main>
