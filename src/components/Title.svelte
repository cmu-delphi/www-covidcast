<script>
  import { currentSensorMapTitle } from '../stores';
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
    }
  }
</style>

<h2 class="banner">
  {$currentSensorMapTitle}
  <slot />
</h2>
