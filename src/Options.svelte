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
    margin-bottom: 0px !important;
    padding-bottom: 0px !important;
  }

  label {
    display: inline-block;
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

  #encoding-options {
    display: flex;
  }

  #encoding-options > div {
    margin-right: 0.5rem;
  }

  .hidden {
    display: none;
  }
</style>

<div class="options">

  <div class="option">
    <label style="font-size: 15px;" class="option-title">
      <strong>Displaying</strong>
    </label>
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

    <label style="font-size: 15px;" class="option-title">
      <strong>&nbsp;for&nbsp;</strong>
    </label>

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

  <br />

<<<<<<< HEAD
  <div id="encoding-options">
    <div class="toggle">
      <div aria-label="display type" class="buttons-group-side">
        <button
          aria-pressed={$signalType === 'value' ? 'true' : 'false'}
          class="button {$signalType === 'value' ? 'selected' : ''}"
          on:click={() => {
            currentDataReadyOnMap.set(false);
            signalType.set('value');
          }}>
          {$currentSensor.match(/num/) ? 'Count' : 'Intensity'}
        </button>
        <button
          aria-pressed={$signalType === 'direction' ? 'true' : 'false'}
          class="button {$signalType === 'direction' ? 'selected' : ''}"
          on:click={() => {
            currentDataReadyOnMap.set(false);
            encoding.set('color');
            signalType.set('direction');
          }}
          disabled={$sensorMap.get($currentSensor).official ? true : false}>
          7-day Trend
          {#if $sensorMap.get($currentSensor).official}
            <span class="disabled-tooltip">Currently unavailable</span>
          {/if}
        </button>
      </div>
    </div>

    <div class="toggle {$signalType === 'direction' ? 'hidden' : ''}">
      <div aria-label="encoding type" class="buttons-group-side">
        <button
          aria-pressed={$encoding === 'color' ? 'true' : 'false'}
          class="button {$encoding === 'color' ? 'selected' : ''}"
          on:click={() => {
            encoding.set('color');
          }}>
          Choropleth
        </button>
        <button
          aria-pressed={$encoding === 'bubble' ? 'true' : 'false'}
          class="button {$encoding === 'bubble' ? 'selected' : ''}"
          on:click={() => {
            encoding.set('bubble');
          }}>
          Bubbles
        </button>
      </div>
    </div>
  </div>
=======
>>>>>>> remotes/origin/main
</div>
