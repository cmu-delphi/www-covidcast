<script>
  import { encoding } from '../stores';
</script>

<style>
  .toggle {
    font-size: 0.8rem;
    position: relative;
    align-items: center;
  }

  .button {
    position: relative;
  }

  button.selected {
    background-color: #dcdcdc !important;
  }

  .buttons-group-side {
    width: 100%;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    padding-top: 5px;
  }

  .buttons-group-side button.button {
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
  .buttons-group-side button.button:not(:last-child) {
    margin-right: 0.5em;
  }

  .button:active {
    border-radius: 4px;
  }

  .buttons-group-side button.button:disabled {
    background-color: rgb(211, 211, 211);
    color: #666;
    cursor: not-allowed;
  }

  .buttons-group-side .button {
    margin: 0px 0.5rem 0px 0.5rem;
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
      aria-pressed={$encoding === 'color' ? 'true' : 'false'}
      class="button {$encoding === 'color' ? 'selected' : ''}"
      on:click={() => {
        encoding.set('color');
      }}>
      <img src="./assets/imgs/choropleth.png" height="31" alt="choropleth icon" />
    </button>
    <button
      aria-pressed={$encoding === 'bubble' ? 'true' : 'false'}
      class="button {$encoding === 'bubble' ? 'selected' : ''}"
      on:click={() => {
        encoding.set('bubble');
      }}>
      <img src="./assets/imgs/bubble.png" height="31" alt="bubble icon" />
    </button>
    <button
      aria-pressed={$encoding === 'spike' ? 'true' : 'false'}
      class="button {$encoding === 'spike' ? 'selected' : ''}"
      on:click={() => {
        encoding.set('spike');
      }}>
      SPIKE
    </button>
  </div>
</div>
