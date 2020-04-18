<script>
  import { currentDate, times, currentSensor, currentDataReadyOnMay } from './stores.js';
  import * as d3 from 'd3';

  let parseTime = d3.timeParse('%Y%m%d');
  let formatTime = d3.timeFormat('%B %d, %Y');

  let val = $currentDate;
  let min = $currentDate;
  let max = $currentDate;

  let rectifiedVal = parseTime(val).getTime();
  let rectifiedMin = parseTime(min).getTime();
  let rectifiedMax = parseTime(max).getTime();

  let prettyDate = '';
  $: prettyDate = formatTime(new Date(rectifiedVal));

  currentDate.subscribe(d => {
    val = d;
    rectifiedVal = parseTime(val).getTime();
  });
  times.subscribe(t => (t ? update($currentSensor, t) : ''));
  currentSensor.subscribe(s => ($times ? update(s, $times) : ''));

  function update(s, t) {
    min = t.get(s)[0];
    max = t.get(s)[1];
    rectifiedMin = parseTime(min).getTime();
    rectifiedMax = parseTime(max).getTime();
    currentDate.set(max);
    console.log(min, max);
  }

  function calculateValFromRectified(rectified) {
    let tempDate = new Date(rectified);
    let year = tempDate.getFullYear();
    let month = ('0' + (tempDate.getMonth() + 1)).slice(-2);
    let date = ('0' + tempDate.getDate()).slice(-2);
    return year + month + date;
  }

  function sliderOnMouseUp() {
    currentDataReadyOnMay.set(false);
    currentDate.set(calculateValFromRectified(rectifiedVal));
  }

  // currentDataReadyOnMay.subscribe(d => console.log('map set:', d));
</script>

<style>
  .time {
    display: inline-flex;
    align-items: center;
    width: 100%;
    position: relative;
  }

  .time p {
    flex-shrink: 0;
    margin-left: 10px;
    color: var(--grey);
  }

  .slider {
    /* flex-grow: 1; */
    -webkit-appearance: none;
    width: 320px;
    height: 6px;
    padding: 0;
    border-radius: 5px !important;
    border-style: none;
    background: #d3d3d3;
    outline: none;
    opacity: 0.7;
    -webkit-transition: 0.2s;
    transition: opacity 0.2s;
  }

  .slider:hover {
    opacity: 1;
  }

  .slider::-moz-focus-outer {
    border: 0;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--red);
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--red);
    cursor: pointer;
  }

  .loader-container {
    position: absolute;
    top: 0;
    bottom: 0;
    right: -40px;
    width: 40px;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loader {
    border: 4px solid #f3f3f3;
    border-radius: 50%;
    border-top: 4px solid #c41230;
    width: 20px;
    height: 20px;
    -webkit-animation: spin 1s linear infinite; /* Safari */
    animation: spin 1s linear infinite;
  }

  /* Safari */
  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>

<div class="time">
  <input
    id="time_slider"
    type="range"
    min={rectifiedMin}
    max={rectifiedMax}
    step={86400000}
    on:mouseup={sliderOnMouseUp}
    class="slider"
    bind:value={rectifiedVal} />
  <p>{prettyDate}</p>
  {#if $currentDataReadyOnMay === false}
    <div class="loader-container">
      <div class="loader" />
    </div>
  {/if}

</div>
