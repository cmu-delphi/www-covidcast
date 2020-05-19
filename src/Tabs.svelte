<script>
  import {
    sensors,
    sensorMap,
    currentSensor,
    levels,
    currentLevel,
    signalType,
    currentDataReadyOnMap,
  } from './stores.js';

  export let isIE;

  let shouldDisplayBanner = true;
  let currentSensorTooltip;

  $: currentSensorTooltip = $sensorMap.get($currentSensor).mapTitleText;
</script>

<style>
  .tabs {
    font-size: 0.8rem;
    width: 100%;
  }

  .buttons-group-side {
    display: flex;
    justify-content: center;
    align-items: stretch;
    flex-wrap: wrap;
    pointer-events: auto;
  }

  .buttons-group-side .button {
    flex-shrink: 0;
    font-size: 1em;
    line-height: 1em;
    background-color: #fff;
    border-style: solid;
    border-color: #dbdbdb;
    border-width: 1px;
    margin: -0.5px;
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

  .buttons-group-side button.button .button-tooltip {
    visibility: hidden;
    width: 180px;
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
    top: 150%;
    left: 50%;
    margin-left: -90px;
  }

  .buttons-group-side button.button .button-tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent #666 transparent;
  }
  .buttons-group-side button.button:hover .button-tooltip {
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

  .banner-container {
    font-size: 0.9rem;
    margin-top: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .banner {
    box-sizing: border-box;
    max-width: 800px;
    background-color: rgba(255, 255, 255, 0.9);
    color: #333;
    font-weight: 400;
    font-size: 1.6em;
    line-height: 1.2em;
    font-weight: 600;
    text-align: center;
    padding: 5px 24px;
    pointer-events: none;
    position: relative;
  }

  .banner-text {
    padding: 1px 5px;
    margin: 0;
    background: transparent;
    pointer-events: auto;
  }

  .hide-banner-button {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    color: #333;
    font-size: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    background-color: transparent;
    padding: 0;
    border: 0;
    transition: opacity 0.1s ease-in;
    pointer-events: auto;
    opacity: 0.5;
  }

  .hide-banner-button:hover {
    opacity: 1;
  }

  .tab-label {
    font-weight: 800;
    flex-shrink: 0;
    font-size: 1em;
    line-height: 1em;
    background-color: #fff;
    border-style: solid;
    border-color: #dbdbdb;
    border-width: 1px;
    margin: -0.5px;
    color: #666666;
    cursor: default;
    justify-content: center;
    padding-bottom: calc(0.5em - 1px);
    padding-left: 1em;
    padding-right: 1em;
    padding-top: calc(0.5em - 1px);
    text-align: center;
    color: black;
    position: relative;
  }

  .official-side {
    margin-top: 5px;
  }
</style>

<div class="tabs">
  <div aria-label="Data Source" class="buttons-group-side">
    <button title="Indicators: " class="tab-label">Indicators:</button>
    {#each Array.from($sensorMap.keys()).filter(d => !$sensorMap.get(d).official) as sensor}
      {#if $sensorMap.get(sensor).bolded}
        <!-- Button text is red -->
        <button
          title={isIE !== undefined ? $sensorMap.get(sensor).tooltipText : ''}
          aria-pressed={$currentSensor === sensor ? 'true' : 'false'}
          class="button {$currentSensor === sensor ? 'selected' : ''}"
          style="color: #8b0000;"
          on:click={() => {
            currentDataReadyOnMap.set(false);
            currentSensor.set(sensor);
            shouldDisplayBanner = true;
          }}>
          <span class="button-tooltip">{$sensorMap.get(sensor).tooltipText}</span>
          {$sensorMap.get(sensor).name}
        </button>
      {:else}
        <button
          title={isIE !== undefined ? $sensorMap.get(sensor).tooltipText : ''}
          aria-pressed={$currentSensor === sensor ? 'true' : 'false'}
          class="button {$currentSensor === sensor ? 'selected' : ''}"
          on:click={() => {
            currentDataReadyOnMap.set(false);
            currentSensor.set(sensor);
            shouldDisplayBanner = true;
          }}>
          <span class="button-tooltip">{$sensorMap.get(sensor).tooltipText}</span>
          {$sensorMap.get(sensor).name}
        </button>
      {/if}
    {/each}
  </div>
  <div aria-label="Data Source" class="official-side buttons-group-side">
    <button title="Official Reports: " class="tab-label">Official Reports:</button>
    {#each Array.from($sensorMap.keys()).filter(d => $sensorMap.get(d).official) as sensor}
      <button
        title={isIE !== undefined ? $sensorMap.get(sensor).tooltipText : ''}
        aria-pressed={$currentSensor === sensor ? 'true' : 'false'}
        class="button {$currentSensor === sensor ? 'selected' : ''}"
        on:click={() => {
          currentDataReadyOnMap.set(false);
          currentSensor.set(sensor);
          shouldDisplayBanner = true;
        }}>
        <span class="button-tooltip">{$sensorMap.get(sensor).tooltipText}</span>
        {$sensorMap.get(sensor).name}
      </button>
    {/each}
  </div>
</div>

{#if shouldDisplayBanner}
  <div class="banner-container">
    <div class="banner">
      <button
        title="Hide map title"
        aria-label="toggle banner"
        class="hide-banner-button"
        on:click={_ => {
          shouldDisplayBanner = false;
        }}>
        &#10005;
      </button>
      <span class="banner-text">{currentSensorTooltip}</span>
    </div>
  </div>
{/if}
