<script>
  import { currentSensorMapTitle, currentDateObject, currentInfoSensor, currentSensorEntry } from '../stores';

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
    display: inline-block;
  }
</style>

<h2 class="banner">
  <span>
    {$currentSensorMapTitle}
    <button
      title="Show sensor description"
      class="uk-icon-button uk-icon-button-small info"
      data-uk-icon="icon: question-plain"
      data-uk-toggle="target: #info-dialog"
      on:click={() => {
        currentInfoSensor.set($currentSensorEntry);
      }} />
  </span>
  {#if showDate}<span data-testid="currentdate">{$currentDateObject.toLocaleDateString()}</span>{/if}
</h2>
