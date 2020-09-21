<script>
  import IoMdHelp from 'svelte-icons/io/IoMdHelp.svelte';
  import { currentSensorEntry, currentSensorMapTitle, currentInfoSensor } from '../stores';
</script>

<style>
  .banner {
    font-size: 1.3rem;
    line-height: 1.2em;
    font-weight: 600;
    text-align: center;
    color: #8c8c8c;
  }
  /** mobile **/
  @media only screen and (max-width: 767px) {
    .banner {
      font-size: 1rem;
      padding: 0;
    }
  }

  .info {
    margin-left: 1em;
    font-size: 0.7rem;
    flex: 0 0 auto;
  }
</style>

<h2 class="banner">
  {$currentSensorMapTitle}
  <slot />
</h2>

{#if $currentSensorEntry && $currentSensorEntry.longDescription}
  <button
    title="Show sensor description"
    class="pg-button pg-button-circle info"
    on:click={() => {
      currentInfoSensor.set($currentSensorEntry);
    }}><IoMdHelp /></button>
{/if}
