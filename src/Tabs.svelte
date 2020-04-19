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
    background-color: rgb(222, 222, 222);
    border-style: solid;
    border-color: #dbdbdb;
    border-left-color: transparent;
    border-width: 1px;
    color: #363636;
    cursor: pointer;
    justify-content: center;
    padding-bottom: calc(0.5em - 1px);
    padding-left: 1em;
    padding-right: 1em;
    padding-top: calc(0.5em - 1px);
    text-align: center;
    /* white-space: nowrap; */

    transition: all 0.1s ease-in;
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

  .buttons-group-side .button.selected {
    background-color: #fff;
    /* border-color: transparent; */
    color: #000;
    font-weight: 600;
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
    <div class="buttons-group-side">
      {#each $sensors as sensor}
        <button
          class="button {$currentSensor === sensor.id ? 'selected' : ''}"
          on:click={() => {
            currentDataReadyOnMay.set(false);
            currentSensor.set(sensor.id);
          }}>
          {sensor.name}
        </button>
      {/each}
    </div>
  </div>

</div>
