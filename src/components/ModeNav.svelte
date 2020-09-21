<script>
  import SingleModeToggle from './SingleModeToggle.svelte';
  import { modeByID } from '../modes';

  // let mode = modeByID.overview;
  // export let label = mode.label;
</script>

<style>
  .mode-container {
    /* text-align: center; */
    margin-left: 0.5em;
    /* border-bottom: 1px solid #ccc; */
  }
</style>

<nav>
  <div class="mode-container">
    <SingleModeToggle mode={modeByID.overview} />
    <SingleModeToggle mode={modeByID.timelapse} />
    <SingleModeToggle mode={modeByID.top10} />
    <SingleModeToggle mode={modeByID.export} />
  </div>
</nav>
