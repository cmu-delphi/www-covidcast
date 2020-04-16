<script>
  import { currentDate } from "./stores.js";
  import * as d3 from "d3";

  let parseTime = d3.timeParse("%Y%m%d");
  let formatTime = d3.timeFormat("%B %d, %Y");

  let prettyDate = "";
  $: prettyDate = formatTime(parseTime($currentDate));
</script>

<div class="time">
  <input
    id="time_slider"
    type="range"
    min="20200406"
    max="20200413"
    bind:value={$currentDate} />
  <p>{prettyDate}</p>
</div>
