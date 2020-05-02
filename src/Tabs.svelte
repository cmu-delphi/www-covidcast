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

  $: currentSensorTooltip = $sensorMap.get($currentSensor).mapTitleText;

  let shouldDisplayBanner = true;

  export let isIE;
</script>

<style>
  .options-container {
    font-size: 0.8rem;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .buttons-group-side {
    display: flex;
    align-items: stretch;
    /* justify-content: center; */
    /* flex-wrap: wrap; */
    pointer-events: auto;
  }

  .buttons-group-side .button {
    margin: 0;
    font-size: 1em;
    font-weight: 400;
    line-height: 1em;
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
    /* white-space: nowrap; */

    transition: all 0.1s ease-in;

    position: relative;
  }

  .buttons-group-side .button:first-child {
    border-left-color: #dbdbdb;
    /* border-top-left-radius: 4px; */
    /* border-bottom-left-radius: 4px; */
  }

  .buttons-group-side .button:last-child {
    /* border-top-right-radius: 4px; */
    /* border-bottom-right-radius: 4px; */
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
    /* border-color: transparent; */
    color: #fff;
    font-weight: 600;
  }

  .buttons-group-side .button:hover {
    background-color: #666666;
    color: #fff;
  }

  .buttons-group-side .button:focus,
  .buttons-group-side .button:active {
    /* box-shadow: none !important; */
    outline: none;
  }

  .banner-container {
    font-size: 0.9rem;
    margin-top: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .banner {
    box-sizing: border-box;
    max-width: 800px;
    /* border-radius: 6px; */
    /* border-style: solid;
    border-width: 1px;
    border-color: #666; */
    background-color: rgba(255, 255, 255, 0.9);
    /* background-color: transparent; */
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
    /* background-color: rgba(255,255,255, 0.9); */
    pointer-events: auto;

    /* position: relative; */
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
</style>

<div class="options-container">
  <div aria-label="Data Source" class="buttons-group-side">
    {#each Array.from($sensorMap.keys()) as sensor}
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
    <h2 class="banner">
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
    </h2>
  </div>
{/if}
