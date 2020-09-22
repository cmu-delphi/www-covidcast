<script>
  import { currentSensorMapTitle, currentDateObject } from '../stores';
</script>

<style>
  .banner {
    padding: 0.25rem 0.5rem;
    font-size: 1.65rem;
    line-height: 1em;
    font-weight: 500;
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
