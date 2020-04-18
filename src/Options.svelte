<script>
  import { sensors, currentSensor, levels, currentLevel, signalType } from './stores.js';

  let hide = false;

  function toggleHide() {
    hide = !hide;
  }
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

  .buttons-group .button {
    width: 100%;
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
    justify-content: stretch;
  }

  .buttons-group-side .button {
    /* width: 50%; */
    flex-grow: 1;
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
  {#if hide}
    <div class="toggle-button" on:click={toggleHide}>
      <img class="toggle-button-icon" src="./assets/imgs/layers-24px.svg" alt="" />
    </div>
  {:else}
    <div class="toggle-button float" on:click={toggleHide}>
      <img class="toggle-button-icon" src="./assets/imgs/layers_clear-24px.svg" alt="" />
    </div>
    <br />

    <!-- <div class="option">
      <div class="buttons-group-title">Data Source</div>
      <div class="buttons-group">
        {#each $sensors as sensor}
          <button
            class="button {$currentSensor === sensor.id ? 'selected' : null}"
            on:click={() => currentSensor.set(sensor.id)}>
            {sensor.name}
          </button>
        {/each}
      </div>
    </div> -->

    <br />

    <div class="option">
      <!-- <div class="buttons-group-title">Geographic Level</div> -->
      <div class="buttons-group">
        {#each $sensors.find(d => d.id === $currentSensor).levels as level}
          <button class="button {$currentLevel === level ? 'selected' : null}" on:click={() => currentLevel.set(level)}>
            {$levels[level]}
          </button>
        {/each}
      </div>
    </div>

    <br />

    <div class="option">
      <!-- <div class="buttons-group-title">Signal Type</div> -->
      <div class="buttons-group-side">
        <button
          class="button {$signalType === 'direction' ? 'selected' : null}"
          on:click={() => signalType.set('direction')}>
          Direction
        </button>
        <button class="button {$signalType === 'value' ? 'selected' : null}" on:click={() => signalType.set('value')}>
          Intensity
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- <div class="options">
  <form class="pure-form">
    <div class="pure-g">
      <div class="pure-u-1 pure-u-md-1-2">
        <label for="sensor">Select sensor:</label>
        <select id="sensor" bind:value={$currentSensor}>
          {#each $sensors as sensor}
            <option value={sensor.id}>{sensor.name}</option>
          {/each}
        </select>
      </div>

      <div class="pure-u-1 pure-u-md-1-2">
        <label for="level">Select level:</label>
        <select id="level" bind:value={$currentLevel}>
          {#each $sensors.find(d => d.id === $currentSensor).levels as level}
            <option value={level}>{$levels[level]}</option>
          {/each}
        </select>
      </div>
    </div>
  </form>
</div> -->
