<script>
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import { modeByID } from '../modes';
  import {
    signalCasesOrDeathOptions,
    currentInfoSensor,
    currentMode,
    currentSensorEntry,
    currentSensor,
  } from '../stores';

  let close = null;

  /**
   * @param {KeyboardEvent} e
   */
  function onEscCheck(e) {
    if (!$currentInfoSensor) {
      return;
    }
    if (e.key === 'Escape' || e.key === 'Esc') {
      currentInfoSensor.set(null);
    }
  }

  $: {
    if ($currentInfoSensor && close) {
      close.focus();
    }
  }

  function exportData(e) {
    e.preventDefault();
    // ensure visible sensor is the active one
    if ($currentSensorEntry.key !== $currentInfoSensor.key) {
      currentSensor.set($currentInfoSensor.key);
    }
    // switch to export mode
    currentMode.set(modeByID.export);
    currentInfoSensor.set(null);
  }
</script>

<style>
  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: none;
    padding: 0.5em 1em;
    max-width: 40em;
    z-index: 5000;
    clear: both;
    border: 1px solid var(--grey);
    box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.35);
  }

  .close {
    position: absolute;
    right: 4px;
    top: 4px;
  }

  .links {
    display: flex;
    align-items: center;
    justify-content: center;
    list-style-type: none;
    font-size: 80%;
    line-height: 1.35em;
  }

  .links > li:not(:first-of-type)::before {
    content: '•';
    transform: translate(-0.35em);
  }

  .links > li {
    list-style-type: none;
    padding: 0;
    display: flex;
  }

  h2 {
    margin-right: 40px;
    padding-top: 0.25em;
  }

  .links :global(a) {
    color: rgba(0, 0, 0, 0.65);
    font-weight: 700;
  }
</style>

{#if $currentInfoSensor}
  <div class="dialog container-bg container-style">
    <button
      bind:this={close}
      class="pg-button close"
      on:click={() => {
        currentInfoSensor.set(null);
      }}
      title="Close this popup">
      <IoIosClose />
    </button>
    <h2>
      {typeof $currentInfoSensor.mapTitleText === 'function' ? $currentInfoSensor.mapTitleText($signalCasesOrDeathOptions) : $currentInfoSensor.mapTitleText}
    </h2>
    <div>
      <p>
        {@html $currentInfoSensor.description ?? 'No description available'}
      </p>
    </div>
    <ul class="links">
      {#each $currentInfoSensor.links as link}
        <li>
          {@html link}
        </li>
      {/each}
      <li>
        <a href={`?mode=${modeByID.export.id}&sensor=${$currentInfoSensor.key}`} on:click={exportData}>Export Data</a>
      </li>
    </ul>
  </div>
{/if}
<svelte:window on:keydown={onEscCheck} />
