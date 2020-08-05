<script>
  import { currentMode } from '../stores';
  import { modes } from '../routes';
</script>

<style>
  .button {
    width: unset;
    padding: 0.2em 1em;
    min-width: 7em;
  }
</style>

<div aria-label="application mode" class="pg-button-group">
  {#each modes as mode}
    <button
      aria-pressed={$currentMode === mode ? 'true' : 'false'}
      class="pg-button button"
      class:selected={$currentMode === mode}
      on:click={() => {
        $currentMode = mode;
      }}
      title={mode.tooltip}>
      {mode.label}
    </button>
  {/each}
</div>
