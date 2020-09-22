<script>
  import { currentMode } from '../stores';
  import { modeByID } from '../modes';

  export let mode = modeByID.overview;
  export let label = mode.label;
</script>

<style>
  .button {
    width: unset;
    padding: 0.2em 1em;
    min-width: 7em;
  }
</style>

<button
  class="pg-button button"
  on:click={() => {
    currentMode.set(mode);
  }}
  title={mode.tooltip}>
  {label}
</button>
