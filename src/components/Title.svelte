<script>
  import { currentSensorMapTitle, currentDateObject } from '../stores';
</script>

<style>
  .banner {
    padding-top: 0.5rem;
    font-size: 2rem;
    line-height: 1em;
    font-weight: 700;
    text-align: center;
    /* color: #8c8c8c; */
    color: black;
    text-transform: uppercase;
    pointer-events: none;
  }
  /** mobile **/
  @media only screen and (max-width: 767px) {
    .banner {
      font-size: 1rem;
    }
  }
</style>

<h2 class="banner">
  {$currentSensorMapTitle}
  <slot />
  <small> {$currentDateObject.toLocaleDateString()} </small>
</h2>

<!-- {#if $currentSensorEntry && $currentSensorEntry.longDescription}
  <button
    title="Show sensor description"
    class="pg-button pg-button-circle info"
    on:click={() => {
      currentInfoSensor.set($currentSensorEntry);
    }}><IoMdHelp /></button>
{/if} -->
