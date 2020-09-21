<script>
  import { currentMode } from '../stores';
  import { modeByID } from '../modes';

  export let mode = modeByID.overview;
  export let hasSpace = false;
</script>

<style>
  .button {
    width: unset;
    padding: 0.2em 1em;
  }
  .s-icon {
    width: 1.2em;
  }

  @media only screen and (max-width: 1200px) {
    .button:not(.hasSpace) {
      padding: 0.2em;
    }

    .button:not(.hasSpace) > .desktop {
      display: none;
    }
  }
</style>

<button
  class="pg-button button"
  class:hasSpace
  on:click={() => {
    currentMode.set(mode);
  }}
  title={mode.tooltip}>
  <span class="s-icon"><svelte:component this={mode.icon} /></span>
  <span class="desktop">{mode.label}</span>
</button>
