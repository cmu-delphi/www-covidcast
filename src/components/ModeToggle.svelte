<script>
  import { currentMode } from '../stores';

  const modes = [
    {
      value: 'overview',
      label: 'Overview',
      tooltip: 'Switch to Overview Mode',
    },
    {
      value: 'compare',
      label: 'Compare',
      tooltip: 'Switch to Comparison Mode',
    },
    {
      value: 'hotspots',
      label: 'Hotspots',
      tooltip: 'Switch to Hotspots Mode',
    },
  ];
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
      aria-pressed={$currentMode === mode.value ? 'true' : 'false'}
      class="pg-button button"
      class:selected={$currentMode === mode.value}
      on:click={() => {
        $currentMode = mode.value;
      }}
      title={mode.tooltip}>
      {mode.label}
    </button>
  {/each}
</div>
