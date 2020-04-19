<script>
  import { sensors, currentSensor, levels, currentLevel, signalType } from './stores.js';

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

  .toggle-button {
    width: 28px;
    height: 28px;
    /* border-radius: 5px; */
    cursor: pointer;
    background-color: transparent;
    padding: 0;
    border: 0;

    transition: all 0.1s ease-in;
  }

  .toggle-button:hover {
    background-color: rgb(228, 228, 228);
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
    font-size: 1em;
  }

  .buttons-group {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .buttons-group button.button {
    width: 100%;
    margin: 0;
    font-size: 1em;
    font-weight: 400;
    background-color: #fff;
    border-style: solid;
    border-color: #dbdbdb;
    border-top-color: transparent;
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

  .buttons-group .button:first-child {
    border-top-color: #dbdbdb;
    /* border-top-left-radius: 4px; */
    /* border-top-right-radius: 4px; */
  }

  .buttons-group .button:last-child {
    /* border-bottom-left-radius: 4px; */
    /* border-bottom-right-radius: 4px; */
  }

  .buttons-group button.button:disabled {
    background-color: rgb(211, 211, 211);
    color: #6c757d;
    cursor: not-allowed;
  }

  .buttons-group button.button .disabled-tooltip {
    visibility: hidden;
    width: 100px;
    background-color: #444;
    color: #fff;
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
    border-color: transparent #444 transparent transparent;
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
    /* width: 50%; */
    flex-grow: 1;
    margin: 0;
    font-size: 1em;
    font-weight: 400;
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

  .buttons-group-side button.button:disabled {
    background-color: rgb(211, 211, 211);
    color: #6c757d;
    cursor: not-allowed;
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

  .buttons-group-side button.button .disabled-tooltip {
    visibility: hidden;
    width: 100px;
    background-color: #444;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px 5px;
    position: absolute;
    z-index: 1;
    top: 150%;
    left: 50%;
    margin-left: -60px;
  }

  .buttons-group-side button.button .disabled-tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent #444 transparent;
  }
  .buttons-group-side button.button:hover .disabled-tooltip {
    visibility: visible;
  }

  .buttons-group .button.selected,
  .buttons-group-side .button.selected {
    background-color: rgb(108, 117, 125);
    /* border-color: transparent; */
    color: #fff;
    font-weight: 600;
  }

  .buttons-group .button:hover,
  .buttons-group-side .button:hover {
    background-color: #5a6268;
    color: #fff;
  }

  .buttons-group .button:focus,
  .buttons-group .button:active,
  .buttons-group-side .button:focus,
  .buttons-group-side .button:active {
    box-shadow: none !important;
    outline: none;
  }

  button.button:disabled:hover {
    animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    transform: translate3d(0, 0, 0);
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
    <button aria-label="toggle options" class="toggle-button" on:click={toggleHide}>
      <img class="toggle-button-icon" src="./assets/imgs/layers-24px.svg" alt="" />
    </button>
  {:else}
    <button aria-label="toggle options" class="toggle-button" on:click={toggleHide}>
      <img class="toggle-button-icon" src="./assets/imgs/layers_clear-24px.svg" alt="" />
    </button>
    <br />
    <br />

    <div class="option">
      <!-- <div class="buttons-group-title">Geographic Level</div> -->
      <div aria-label="geographic level" class="buttons-group">
        {#each Object.keys($levels) as level}
          <button
            class="button {$currentLevel === level ? 'selected' : ''}"
            on:click={() => currentLevel.set(level)}
            disabled={$sensors.find(d => d.id === $currentSensor).levels.includes(level) === false}>
            {#if $sensors.find(d => d.id === $currentSensor).levels.includes(level) === false}
              <span class="disabled-tooltip">Currently unavailable</span>
            {/if}
            {$levels[level]}
          </button>
        {/each}
        <!-- {#each $sensors.find(d => d.id === $currentSensor).levels as level}
          <button class="button {$currentLevel === level ? 'selected' : ''}" on:click={() => currentLevel.set(level)}>
            {$levels[level]}
          </button>
        {/each} -->
      </div>
    </div>

    <br />

    <div class="option">
      <!-- <div class="buttons-group-title">Signal Type</div> -->
      <div aria-label="display type" class="buttons-group-side">
        <button class="button {$signalType === 'value' ? 'selected' : ''}" on:click={() => signalType.set('value')}>
          Intensity
        </button>
        <button
          class="button {$signalType === 'direction' ? 'selected' : ''}"
          on:click={() => signalType.set('direction')}
          disabled={$currentSensor === 'fb_survey'}>
          {#if $currentSensor === 'fb_survey'}
            <span class="disabled-tooltip">Currently unavailable</span>
          {/if}
          Direction
        </button>

      </div>
    </div>
  {/if}
</div>
