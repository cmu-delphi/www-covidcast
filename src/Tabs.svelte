<script>
  import { sensors, currentSensor, levels, currentLevel, signalType, currentDataReadyOnMay } from './stores.js';

  let hide = false;

  function toggleHide() {
    hide = !hide;
  }
</script>

<style>
  .options {
    font-size: 0.8rem;
    width: 100%;
    position: relative;
  }

  .option {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .buttons-group-title {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 15px;

    font-weight: 600;
    font-size: 1em;
    line-height: 1em;
  }

  .buttons-group-side {
    display: flex;
    align-items: stretch;
    /* justify-content: center; */
    /* flex-wrap: wrap; */
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
    color: #6c757d;
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
    background-color: rgb(108, 117, 125);
    /* border-color: transparent; */
    color: #fff;
    font-weight: 600;
  }

  .buttons-group-side .button:hover {
    background-color: #5a6268;
    color: #fff;
  }

  .buttons-group-side .button:focus,
  .buttons-group-side .button:active {
    box-shadow: none !important;
    outline: none;
  }
</style>

<div class="options">
  <div class="option">
    <!-- <div class="buttons-group-title">Data Source</div> -->
    <div aria-label="Data Source" class="buttons-group-side">
      {#each $sensors as sensor}
        <button
          class="button {$currentSensor === sensor.id ? 'selected' : ''}"
          on:click={() => {
            currentDataReadyOnMay.set(false);
            currentSensor.set(sensor.id);
          }}>
          <span class="button-tooltip">{sensor.tooltipText}</span>
          {sensor.name}
        </button>
      {/each}
    </div>
  </div>

</div>
