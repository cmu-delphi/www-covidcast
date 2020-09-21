<script>
  import SingleModeToggle from './SingleModeToggle.svelte';
  import { modeByID } from '../modes';

  export let mode = modeByID.overview;
  // export let label = mode.label;
</script>

<style>
  .mode-container {
    margin-left: 0.5em;
  }
</style>

<nav>
  <div class="mode-container">
    <SingleModeToggle mode={modeByID.overview} />
    <SingleModeToggle mode={modeByID.export} />
    <SingleModeToggle mode={modeByID.top10} />
    <SingleModeToggle mode={modeByID.timelapse} />
  </div>
</nav>
