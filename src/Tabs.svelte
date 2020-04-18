<script>
  import { data, sensors, currentSensor, levels, currentLevel, signalType } from './stores.js';

  let hide = false;

  function toggleHide() {
    hide = !hide;
  }

  currentSensor.subscribe(sens =>
    data ? '' : $data[sens][$currentLevel] ? '' : currentLevel.set($sensors.find(d => d.id === sens).levels[0]),
  );
</script>

<style>
  .options {
    width: 100%;
    position: relative;
  }

  .toggle-button {
    width: 28px;
    height: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    cursor: pointer;
    background-color: transparent;

    transition: all 0.1s ease-in;
  }

  .toggle-button:hover {
    background-color: rgb(228, 228, 228);
  }

  .toggle-button.float {
    position: absolute;
    top: 0;
    left: 0;
  }

  .toggle-button-icon {
    width: 24px;
    height: 24px;
  }

  .option {
    width: 100%;
  }

  .buttons-group-title {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 5px;

    font-weight: 600;
    font-size: 1.1rem;
  }

  .buttons-group {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .buttons-group-side {
    width: 100%;
    display: flex;
    align-items: stretch;
    justify-content: center;
  }

  .buttons-group .button {
    /* width: 220px; */
    margin: 0;
    font-size: 0.95rem;
    line-height: 1rem;
    background-color: #fff;
    border-style: solid;
    border-color: #dbdbdb;
    border-top-color: transparent;
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
  }

  .buttons-group-side {
    width: 100%;
    display: flex;
    align-items: stretch;
    justify-content: center;
  }

  .buttons-group-side .button {
    width: 50%;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1rem;
    background-color: #fff;
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
  }

  .buttons-group .button:first-child {
    border-top-color: #dbdbdb;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  .buttons-group .button:last-child {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .buttons-group-side .button:first-child {
    border-left-color: #dbdbdb;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  .buttons-group-side .button:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .buttons-group .button.selected,
  .buttons-group-side .button.selected {
    background-color: var(--red-alpha);
    border-color: transparent;
    color: #fff;
  }

  .buttons-group .button:focus,
  .buttons-group .button:active,
  .buttons-group-side .button:focus,
  .buttons-group-side .button:active {
    box-shadow: none !important;
    outline: none;
  }
</style>

<div class="options">

  <div class="option">
    <div class="buttons-group-title">Data Source</div>
    <div class="buttons-group-side">
      {#each $sensors as sensor}
        <button
          class="button {$currentSensor === sensor.id ? 'selected' : null}"
          on:click={() => currentSensor.set(sensor.id)}>
          {sensor.name}
        </button>
      {/each}
    </div>
  </div>

</div>
