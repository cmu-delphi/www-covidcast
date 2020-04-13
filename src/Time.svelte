<script>
  import { currentWeek, currentDate } from "./stores.js";
  import * as d3 from "d3";

  let prettyWeek = "";

  let parseTime = d3.timeParse("%Y%U");
  let formatTime = d3.timeFormat("%B %d, %Y");

  $: prettyWeek = formatTime(parseTime($currentWeek));
</script>

<div class="time">
  <input
    id="time_slider"
    type="range"
    min="202010"
    max="202014"
    bind:value={$currentWeek} />
  <p>Week of {prettyWeek}</p>
</div>
