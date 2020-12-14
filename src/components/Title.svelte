<script>
  import { currentSensorMapTitle, currentDateObject, currentInfoSensor, currentSensorEntry } from '../stores';
  import IoMdHelp from 'svelte-icons/io/IoMdHelp.svelte';

  export let showDate = false;
</script>

<style>
  .banner {
    font-size: 12px;
    font-weight: bold;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0.2em 1em;
    margin: 0;
  }

  .info {
    width: 1.5em;
    height: 1.5em;
    display: inline-block;
  }
</style>

<h2 class="banner">
  <span>
    {$currentSensorMapTitle}
    <button
      title="Show sensor description"
      class="pg-button pg-button-circle info"
      on:click={() => {
        currentInfoSensor.set($currentSensorEntry);
      }}><IoMdHelp /></button>
  </span>
  {#if showDate}<span data-testid="currentdate">{$currentDateObject.toLocaleDateString()}</span>{/if}
</h2>
