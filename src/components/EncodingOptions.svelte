<script>
  import { currentSensorEntry, signalCasesOrDeathOptions } from '../stores';

  export let center = false;
  export let sensor = $currentSensorEntry;
  export let className = '';
</script>

{#if sensor.isCasesOrDeath}
  <div class="root {className}" class:center>
    <div aria-label="display cumulative or new incidents" class="uk-button-group">
      <button
        type="button"
        aria-pressed={String(!$signalCasesOrDeathOptions.cumulative)}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={!$signalCasesOrDeathOptions.cumulative}
        on:click={() => {
          if ($signalCasesOrDeathOptions.cumulative) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, cumulative: false });
          }
        }}
      >
        New
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
        }}
      >
        Cumulative
      </button>
    </div>
    <div aria-label="display counts or ratios per 100,000 people" class="uk-button-group">
      <button
        type="button"
        aria-pressed={String(!$signalCasesOrDeathOptions.incidence)}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={!$signalCasesOrDeathOptions.incidence}
        on:click={() => {
          if ($signalCasesOrDeathOptions.incidence) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, incidence: false });
          }
        }}
      >
        Ratios (per 100,000)
      </button>
      <button
        type="button"
        aria-pressed={String($signalCasesOrDeathOptions.incidence)}
        class="uk-button uk-button-default uk-button-small"
        class:uk-active={$signalCasesOrDeathOptions.incidence}
        on:click={() => {
          if (!$signalCasesOrDeathOptions.incidence) {
            signalCasesOrDeathOptions.set({ ...$signalCasesOrDeathOptions, incidence: true });
          }
        }}
      >
        Counts
      </button>
    </div>
  </div>
{/if}

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
