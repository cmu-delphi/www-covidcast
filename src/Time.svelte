<script>
  import { currentWeek } from "./stores.js";
</script>

<p>
  current week selected is
  <b>{$currentWeek}</b>
</p>
<input type="range" min="202010" max="202014" bind:value={$currentWeek} />
