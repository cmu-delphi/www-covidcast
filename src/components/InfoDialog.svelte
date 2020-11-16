<script>
  /*global UIkit*/
  import { onMount } from 'svelte';
  import { modeByID } from '../modes';
  import {
    signalCasesOrDeathOptions,
    currentInfoSensor,
    currentMode,
    currentSensorEntry,
    currentSensor,
  } from '../stores';

  let close = null;
  let oldFocus = null;

  $: {
    if ($currentInfoSensor && close) {
      oldFocus = document.activeElement;
      close.focus();
    }
  }

  function restoreFocus() {
    if (oldFocus) {
      oldFocus.focus();
      oldFocus = null;
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
    oldFocus = null;
  }

  let dialog;
  onMount(() => {
    UIkit.util.on(dialog, 'hidden', () => {
      // unset upon hidden
      restoreFocus();
      currentInfoSensor.set(null);
    });
  });
</script>

<style>
</style>

<div id="info-dialog" data-uk-modal bind:this={dialog}>
  <div class="uk-modal-dialog uk-margin-auto-vertical" data-uk-overflow-auto>
    <button class="uk-modal-close-default" type="button" data-uk-close title="Close this popup" />
    <div class="uk-modal-header">
      <h2 class="uk-modal-title">
        {#if $currentInfoSensor}
          {typeof $currentInfoSensor.mapTitleText === 'function' ? $currentInfoSensor.mapTitleText($signalCasesOrDeathOptions) : $currentInfoSensor.mapTitleText}
        {:else}No Sensor selected{/if}
      </h2>
    </div>
    <div class="uk-modal-body">
      <p>
        {#if $currentInfoSensor}
          {@html $currentInfoSensor.description || 'No description available'}
        {:else}No description available{/if}
      </p>
    </div>
    <div class="uk-modal-footer">
      <ul class="links">
        {#if $currentInfoSensor}
          {#each $currentInfoSensor.links as link}
            <li>
              {@html link}
            </li>
          {/each}
          <li>
            <a href={`?mode=${modeByID.export.id}&sensor=${$currentInfoSensor.key}`} on:click={exportData}>Export Data</a>
          </li>
        {/if}
      </ul>
    </div>
  </div>
</div>
