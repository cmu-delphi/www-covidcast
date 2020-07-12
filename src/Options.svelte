<script>
  import {
    sensorMap,
    currentSensor,
    levels,
    currentLevel,
    signalType,
    currentDataReadyOnMap,
    encoding,
  } from './stores.js';

  let hide = false;
  let shouldDisplayBanner = true;

  $: sensor = $currentSensor;
  $: level = $currentLevel;

  currentSensor.subscribe(s => {
    if ($sensorMap.get($currentSensor).levels.includes(level) === false) {
      level = $levels['msa'];
    }
    if (!$currentSensor.match(/num/)) {
      encoding.set('color');
    }
  });

  export let isIE;
</script>

<style>
  .options {
    font-size: 0.8rem;
    width: 100%;
    position: relative;
  }

  .option {
    width: 100%;
    display: inline-block;
  }

  .option .option-title {
    margin-left: 5px;
    margin-right: 5px;
    color: #444;
    margin-bottom: 0px !important;
    padding-bottom: 0px !important;
  }

  label {
    display: inline-block;
  }

  select {
    background-color: #ececec;
    border-radius: 5px;
    border: none;
    color: #111;
    line-height: 1.3;
    padding: 0.4em 1.4em 0.4em 0.8em;

    -moz-appearance: none;
    -webkit-appearance: none;
    appearance: none;

    background-image: linear-gradient(45deg, transparent 50%, gray 50%),
      linear-gradient(135deg, gray 50%, transparent 50%);
    background-position: calc(100% - 15px) calc(0.85em + 0px), calc(100% - 10px) calc(0.85em + 0px);
    background-size: 5px 5px, 5px 5px;
    background-repeat: no-repeat;

    transition: all 0.1s ease-in;
  }

  select:hover {
    background-color: #dcdcdc;
  }

  select.indicators {
    display: inline-block;
    width: 230px;
  }

  select.geo-level {
    display: inline-block;
    width: 125px;
  }

  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-1px, 0, 0);
    }

    20%,
    80% {
      transform: translate3d(2px, 0, 0);
    }

    30%,
    50%,
    70% {
      transform: translate3d(-4px, 0, 0);
    }

    40%,
    60% {
      transform: translate3d(4px, 0, 0);
    }
  }
</style>

<div class="options">

  <div class="option">
    <label style="font-size: 15px;" class="option-title">Displaying</label>
    <select
      aria-label="indicator options"
      class="indicators"
      bind:value={sensor}
      on:change={() => {
        currentDataReadyOnMap.set(false);
        currentSensor.set(sensor);
        shouldDisplayBanner = true;
      }}>
      <optgroup label="Indicators">
        {#each Array.from($sensorMap.keys()).filter(d => !$sensorMap.get(d).official) as sensor}
          <option title={$sensorMap.get(sensor).tooltipText} value={sensor}>{$sensorMap.get(sensor).name}</option>
        {/each}
      </optgroup>
      <optgroup label="Official Reports">
        {#each Array.from($sensorMap.keys()).filter(d => $sensorMap.get(d).official) as sensor}
          <option title={$sensorMap.get(sensor).tooltipText} value={sensor}>{$sensorMap.get(sensor).name}</option>
        {/each}
      </optgroup>
    </select>

    <label style="font-size: 15px;" class="option-title">for</label>

    <select
      aria-label="geographic level"
      class="geo-level"
      bind:value={level}
      on:change={() => {
        currentDataReadyOnMap.set(false);
        currentLevel.set(level);
      }}>
      {#each Object.keys($levels) as level}
        <option value={level} disabled={$sensorMap.get($currentSensor).levels.includes(level) === false}>
          {$levels[level]}
        </option>
      {/each}
    </select>

  </div>
</div>
