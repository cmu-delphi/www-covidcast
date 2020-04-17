<script>
  import { currentDate, times, currentSensor } from './stores.js';
  import * as d3 from 'd3';

  let parseTime = d3.timeParse('%Y%m%d');
  let formatTime = d3.timeFormat('%B %d, %Y');

  let prettyDate = '';
  $: prettyDate = formatTime(parseTime($currentDate));

  let min = 0;
  let max = 1;

  times.subscribe(t => (t ? update($currentSensor, t) : ''));
  currentSensor.subscribe(s => ($times ? update(s, $times) : ''));

  function update(s, t) {
    min = t.get(s)[0];
    max = t.get(s)[1];
    currentDate.set(max);
  }
</script>

<div class="time">
  <input id="time_slider" type="range" {min} {max} bind:value={$currentDate} class="slider" />
  <p>{prettyDate}</p>
</div>
