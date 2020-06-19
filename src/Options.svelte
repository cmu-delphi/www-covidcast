<script>
  import { sensorMap, currentSensor, levels, currentLevel, signalType, currentDataReadyOnMap } from './stores.js';

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

  .toggle-button {
    width: 28px;
    height: 28px;
    cursor: pointer;
    background-color: transparent;
    padding: 0;
    border: 0;
    transition: all 0.1s ease-in;
  }

  .toggle-button-icon {
    width: 24px;
    height: 24px;
  }

  .option {
    width: 100%;
  }

  .buttons-group {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .buttons-group button.button .disabled-tooltip {
    visibility: hidden;
    width: 80px;
    border-style: solid;
    border-width: 1px;
    border-color: #666;
    background-color: #fff;
    color: #333;
    font-weight: 400;
    font-size: 0.95em;
    line-height: 1.2em;
    text-align: center;
    border-radius: 6px;
    padding: 5px 5px;
    position: absolute;
    z-index: 1;
    top: -5px;
    left: 105%;
  }

  .buttons-group button.button .disabled-tooltip::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent #666 transparent transparent;
  }

  .buttons-group button.button:hover .disabled-tooltip {
    visibility: visible;
  }

  .buttons-group-side {
    width: 100%;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
  }

  .buttons-group-side button.button {
    flex-grow: 1;
    margin: 0;
    font-size: 1em;
    font-weight: 400;
    background-color: #fff;
    border-style: solid;
    border-color: #dbdbdb;
    border-left-color: transparent;
    border-width: 1px;
    color: #666666;
    cursor: pointer;
    justify-content: center;
    padding-bottom: calc(0.5em - 1px);
    padding-left: 1em;
    padding-right: 1em;
    padding-top: calc(0.5em - 1px);
    text-align: center;
    transition: all 0.1s ease-in;
    position: relative;
  }

  .buttons-group-side button.button:disabled {
    background-color: rgb(211, 211, 211);
    color: #666666;
    cursor: not-allowed;
  }

  .buttons-group-side .button:first-child {
    border-left-color: #dbdbdb;
  }

  .buttons-group-side button.button .disabled-tooltip {
    visibility: hidden;
    width: 80px;
    border-style: solid;
    border-width: 1px;
    border-color: #666;
    background-color: #fff;
    color: #333;
    font-size: 0.95em;
    line-height: 1.2em;
    font-weight: 400;
    text-align: center;
    border-radius: 6px;
    padding: 5px 5px;
    position: absolute;
    z-index: 1;
    top: 150%;
    left: 50%;
    margin-left: -50px;
  }

  .buttons-group-side button.button .disabled-tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent #666 transparent;
  }
  .buttons-group-side button.button:hover .disabled-tooltip {
    visibility: visible;
  }

  .buttons-group-side .button.selected {
    background-color: #767676;
    color: #fff;
    font-weight: 600;
  }

  .buttons-group-side .button:hover {
    background-color: #666666;
    color: #fff;
  }

  .buttons-group-side .button:focus,
  .buttons-group-side .button:active {
    outline: none;
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
  {#if hide}
    <button
      role="switch"
      aria-checked="false"
      aria-label="toggle options"
      class="toggle-button"
      on:click={_ => (hide = !hide)}>
      <img class="toggle-button-icon" src="./assets/imgs/layers-24px.svg" alt="" />
    </button>
  {:else}
    <button
      role="switch"
      aria-checked="true"
      aria-label="toggle options"
      class="toggle-button"
      on:click={_ => (hide = !hide)}>
      <img class="toggle-button-icon" src="./assets/imgs/layers_clear-24px.svg" alt="" />
    </button>
    <div class="option">
      <p style="font-size: 15px;">
        <strong>Geo-level:</strong>
      </p>
      <select
        aria-label="geographic level"
        class="buttons-group"
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

    <div class="option">
      <p style="font-size: 15px;">
        <strong>Indicators:</strong>
      </p>
      <select
        aria-label="geographic level"
        class="buttons-group"
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
    </div>

    <br />

    <div class="option">
      <div aria-label="display type" class="buttons-group-side">
        <button
          aria-pressed={$signalType === 'value' ? 'true' : 'false'}
          class="button {$signalType === 'value' ? 'selected' : ''}"
          on:click={() => {
            currentDataReadyOnMap.set(false);
            signalType.set('value');
          }}>
          Intensity
        </button>
        <button
          aria-pressed={$signalType === 'direction' ? 'true' : 'false'}
          class="button {$signalType === 'direction' ? 'selected' : ''}"
          on:click={() => {
            currentDataReadyOnMap.set(false);
            signalType.set('direction');
          }}>
          7-day Trend
        </button>
      </div>
    </div>
  {/if}
</div>
