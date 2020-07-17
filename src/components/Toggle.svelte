<script>
  import { signalType, currentSensor, encoding } from '../stores';

  function toggle_switch() {
    if ($encoding === 'color') {
      encoding.set('bubble');
    } else {
      encoding.set('color');
    }
  }
</script>

<style>
  .toggle {
    font-size: 0.8rem;
    position: relative;
    align-items: center;
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
    padding-top: 5px;
  }

  .buttons-group-side button.button {
    width: 110px;
    flex-grow: 1;
    margin: 0px;
    font-size: 1em;
    font-weight: 400;
    background-color: #fff;
    border-style: solid;
    border-color: #dbdbdb;
    border-width: 1px;
    border-radius: 4px;
    color: #666;
    cursor: pointer;
    justify-content: center;
    padding-bottom: calc(0.5em - 1px);
    padding-left: 0.5em;
    padding-right: 0.5em;
    padding-top: calc(0.5em - 1px);
    text-align: center;

    position: relative;
  }

  .buttons-group-side button.button:disabled {
    background-color: rgb(211, 211, 211);
    color: #666;
    cursor: not-allowed;
  }

  .buttons-group-side .button:first-child {
    margin-right: 4px;
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

  .buttons-group-side .button:hover {
    background-color: #dcdcdc;
    color: #111;
  }
  .buttons-group-side .button.selected {
    background-color: #dcdcdc;
    color: #111;

    border-color: transparent;
  }

  .buttons-group-side .button:focus,
  .buttons-group-side .button:active {
    outline: none;
  }
</style>

<div class="toggle">
  <span>Switch to</span>
  <div aria-label="encoding type" class="buttons-group-side">
    <button
      aria-pressed={$encoding === 'bubble' ? 'true' : 'false'}
      class="button {$encoding === 'bubble' ? 'selected' : ''}"
      on:click={() => {
        toggle_switch();
      }}
      disabled={$signalType === 'direction' || !$currentSensor.match(/num/) ? true : false}>
      <img src="./assets/imgs/bubble_icon.svg" alt="" />
      {#if $signalType === 'direction' || !$currentSensor.match(/num/)}
        <span class="disabled-tooltip">Unavailable</span>
      {/if}
    </button>
  </div>
</div>
