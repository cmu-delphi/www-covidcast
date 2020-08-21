<script>
  import { currentSensorEntry, signalCasesOrDeathOptions } from '../stores';

  export let center = false;
  export let sensor = $currentSensorEntry;
  export let className = '';
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .center {
    align-items: center;
  }

  .button-group {
    margin: 0.2em;
  }

  .button {
    width: 10em;
    padding: 0.2em 0.5em;
  }
</style>

{#if sensor.isCasesOrDeath}
  <div class="root {className}" class:center>
    <div aria-label="display cumulative or indicence" class="pg-button-group button-group">
      <button
        aria-pressed={String(!$signalCasesOrDeathOptions.cumulative)}
        class="pg-button button"
        class:selected={!$signalCasesOrDeathOptions.cumulative}
        on:click={() => {
          if ($signalCasesOrDeathOptions.cumulative) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, cumulative: false });
          }
        }}>
        Incidence
      </button>
      <button
        aria-pressed={$signalCasesOrDeathOptions.cumulative}
        class="pg-button button"
        class:selected={$signalCasesOrDeathOptions.cumulative}
        on:click={() => {
          if (!$signalCasesOrDeathOptions.cumulative) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, cumulative: true });
          }
        }}>
        Cumulative
      </button>
    </div>
    <div aria-label="display counts or ratio per 100K people" class="pg-button-group button-group">
      <button
        aria-pressed={String(!$signalCasesOrDeathOptions.ratio)}
        class="pg-button button"
        class:selected={!$signalCasesOrDeathOptions.ratio}
        on:click={() => {
          if ($signalCasesOrDeathOptions.ratio) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, ratio: false });
          }
        }}>
        Counts
      </button>
      <button
        aria-pressed={String($signalCasesOrDeathOptions.ratio)}
        class="pg-button button"
        class:selected={$signalCasesOrDeathOptions.ratio}
        on:click={() => {
          if (!$signalCasesOrDeathOptions.ratio) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, ratio: true });
          }
        }}>
        Ratio per 100K
      </button>
    </div>
    <!-- <div aria-label="display type" class="pg-button-group button-group">
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
  </div> -->
  </div>
{/if}
