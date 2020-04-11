<script>
  import { currentWeek } from "./stores.js";
</script>

<p>
  current week selected is
  <b>{$currentWeek}</b>
</p>
<input type="range" min="0" max="10" bind:value={$currentWeek} />
