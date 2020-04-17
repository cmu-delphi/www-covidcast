<script>
  import { currentDate, times, currentSensor } from './stores.js';
  import * as d3 from 'd3';

  let parseTime = d3.timeParse('%Y%m%d');
  let formatTime = d3.timeFormat('%B %d, %Y');

  let prettyDate = '';
  $: prettyDate = formatTime(parseTime(val));

  let val = $currentDate;
  let min = 0;
  let max = 1;

  currentDate.subscribe(d => (val = d));
  times.subscribe(t => (t ? update($currentSensor, t) : ''));
  currentSensor.subscribe(s => ($times ? update(s, $times) : ''));

  function update(s, t) {
    min = t.get(s)[0];
    max = t.get(s)[1];
    currentDate.set(max);
  }
</script>

<style>
  #time_slider {
    width: 350px;
  }
</style>

<div class="time">
  <input
    id="time_slider"
    type="range"
    {min}
    {max}
    on:mouseup={_ => currentDate.set(val)}
    class="slider"
    bind:value={val} />
  <p>{prettyDate}</p>
</div>
