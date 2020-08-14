<script>
  import { signalType, currentSensorEntry } from '../stores';
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .button-group {
    margin: 0.2em;
  }

  .button {
    width: 10em;
  }
</style>

<div class="root">
  <div aria-label="display type" class="pg-button-group button-group">
    <button
      aria-pressed={$signalType === 'value' ? 'true' : 'false'}
      class="pg-button button"
      class:selected={$signalType === 'value'}
      on:click={() => {
        if ($signalType !== 'value') {
          signalType.set('value');
        }
      }}>
      {$currentSensorEntry.isCount ? 'Count' : 'Intensity'}
    </button>
    <button
      aria-pressed={$signalType === 'direction' ? 'true' : 'false'}
      class="pg-button button"
      class:selected={$signalType === 'direction'}
      on:click={() => {
        if ($signalType !== 'direction') {
          signalType.set('direction');
        }
      }}
      disabled>
      7-day Trend
    </button>

  </div>
</div>
