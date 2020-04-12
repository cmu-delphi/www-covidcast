<script>
  import { currentWeek, currentDate } from "./stores.js";

</script>

<p>
  current week selected is
  <b>{$currentWeek}</b>
</p>
<input id="time_slider" type="range" min="202010" max="202014" bind:value={$currentWeek} />

