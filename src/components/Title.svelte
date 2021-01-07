<script>
  import { currentSensorMapTitle, currentDateObject, currentSensorEntry } from '../stores';
  import InfoDialogButton from './InfoDialogButton.svelte';

  export let showDate = false;
</script>

<style>
  .banner {
    font-size: 1rem;
    font-weight: bold;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin: 0;
    padding: 6px 1em;
    background: white;
  }

  .banner :global(.info) {
    display: inline-block;
  }
</style>

<h2 class="banner">
  <span>
    {$currentSensorMapTitle}
    <InfoDialogButton sensor={$currentSensorEntry} className="info" />
  </span>
  {#if showDate}<span data-testid="currentdate">{$currentDateObject.toLocaleDateString()}</span>{/if}
</h2>
