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

  button {
    width: 13em;
  }
</style>

{#if sensor.isCasesOrDeath}
  <div class="root {className}" class:center>
    <div aria-label="display cumulative or indicence" class="uk-button-group">
      <button
        type="button"
        aria-pressed={String(!$signalCasesOrDeathOptions.cumulative)}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={!$signalCasesOrDeathOptions.cumulative}
        on:click={() => {
          if ($signalCasesOrDeathOptions.cumulative) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, cumulative: false });
          }
        }}>
        Incidence
      </button>
      <button
        type="button"
        aria-pressed={$signalCasesOrDeathOptions.cumulative}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={$signalCasesOrDeathOptions.cumulative}
        on:click={() => {
          if (!$signalCasesOrDeathOptions.cumulative) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, cumulative: true });
          }
        }}>
        Cumulative
      </button>
    </div>
    <div aria-label="display counts or ratios per 100,000 people" class="uk-button-group">
      <button
        type="button"
        aria-pressed={String(!$signalCasesOrDeathOptions.ratio)}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={!$signalCasesOrDeathOptions.ratio}
        on:click={() => {
          if ($signalCasesOrDeathOptions.ratio) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, ratio: false });
          }
        }}>
        Counts
      </button>
      <button
        type="button"
        aria-pressed={String($signalCasesOrDeathOptions.ratio)}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={$signalCasesOrDeathOptions.ratio}
        on:click={() => {
          if (!$signalCasesOrDeathOptions.ratio) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, ratio: true });
          }
        }}>
        Ratios (per 100,000)
      </button>
    </div>
    <!-- <div aria-label="display type" class="pg-button-group button-group">
    <button
      aria-pressed={$signalType === 'value' ? 'true' : 'false'}
      class="uk-button uk-button-default"
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
      class="uk-button uk-button-default"
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
