<script>
  import { encoding } from '../stores';

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

  .buttons-group-side .button:hover {
    background-color: #dcdcdc;
    color: #111;
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
      }}>
      {#if $encoding === 'bubble'}
        <img src="./assets/imgs/choropleth_icon.svg" alt="" />
      {:else}
        <img src="./assets/imgs/bubble_icon.svg" alt="" />
      {/if}
    </button>
  </div>
</div>
