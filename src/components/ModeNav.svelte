<script>
  import SingleModeToggle from './SingleModeToggle.svelte';
  import { modeByID } from '../modes';
</script>

<style>
  .mode-container {
    margin-left: 0.5em;
  }

  @media only screen and (max-width: 767px) {
    .hide-mobile {
      display: none;
    }
  }
</style>

<nav>
  <div class="mode-container">
    <SingleModeToggle mode={modeByID.overview} />
    <SingleModeToggle mode={modeByID.timelapse} />
    <SingleModeToggle mode={modeByID.top10} />
    <span class="hide-mobile">
      <SingleModeToggle mode={modeByID.export} />
    </span>
  </div>
</nav>
