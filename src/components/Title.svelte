<script>
  import { currentSensorMapTitle, currentDateObject, currentInfoSensor, currentSensorEntry } from '../stores';
  import IoMdHelp from 'svelte-icons/io/IoMdHelp.svelte';
</script>

<style>
  .banner {
    font-size: 0.9em;
    font-weight: bold;
  }

  .info {
    display: inline-block;
  }

  .banner button {
    width: 1.5em;
    height: 1.5em;
  }

  .title-date {
    text-align: center;
  }
  /** mobile **/
  @media only screen and (max-width: 767px) {
    .banner {
      /* font-size: 1rem; */
    }
  }
</style>

<h2 class="banner">
  {$currentSensorMapTitle}
  <button
    title="Show sensor description"
    class="pg-button pg-button-circle info"
    on:click={() => {
      currentInfoSensor.set($currentSensorEntry);
    }}><IoMdHelp /></button>
  <slot />
  <div class="title-date">{$currentDateObject.toLocaleDateString()}</div>
</h2>
