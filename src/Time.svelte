<script>
  import { onMount } from 'svelte';
  import { currentDate, times, currentSensor, currentDataReadyOnMay } from './stores.js';
  import * as d3 from 'd3';

  let timeSliderPaddingLeft;
  let timeSliderPaddingRight;
  let timeSlider;

  let parseTime = d3.timeParse('%Y%m%d');
  let formatTime = d3.timeFormat('%B %d, %Y');

  let interval = 14;
  let sliderTotalLength = 320; // in px

  let val = $currentDate;
  let min = $currentDate;
  let max = $currentDate;

  let today = new Date(
    new Date()
      .toJSON()
      .slice(0, 10)
      .replace(/-/g, '/'),
  );

  let rectifiedVal = parseTime(val).getTime();
  let rectifiedMax = today.getTime();
  let rectifiedMin = rectifiedMax - interval * 86400 * 1000;

  let dataRangeMin = min;
  let dataRangeMax = max;

  let prettyDate = '';
  $: prettyDate = formatTime(new Date(rectifiedVal));

  currentDate.subscribe(d => {
    val = d;
    rectifiedVal = parseTime(val).getTime();
  });
  times.subscribe(t => (t ? update($currentSensor, t) : ''));
  currentSensor.subscribe(s => ($times ? update(s, $times) : ''));

  function update(s, t) {
    max = t.get(s)[1];
    min = t.get(s)[0];
    dataRangeMin = parseTime(min).getTime();
    dataRangeMax = parseTime(max).getTime();

    if (dataRangeMax <= rectifiedMax && dataRangeMin >= rectifiedMin) {
      /**
       * fall within
       *    -------------------
       *        ---------
       */
      let leftPercentage = (dataRangeMin - rectifiedMin) / (interval * 86400 * 1000);
      let middlePercentage = (dataRangeMax - dataRangeMin) / (interval * 86400 * 1000);
      let rightPercentage = (rectifiedMax - dataRangeMax) / (interval * 86400 * 1000);
      timeSliderPaddingLeft.setAttribute('style', `width: ${Math.round(leftPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('style', `width: ${Math.round(middlePercentage * sliderTotalLength) + 'px'}`);
      timeSliderPaddingRight.setAttribute('style', `width: ${Math.round(rightPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('min', dataRangeMin);
      timeSlider.setAttribute('max', dataRangeMax);
    } else if (dataRangeMax <= rectifiedMax && dataRangeMin <= rectifiedMin) {
      /**
       *
       *    -------------------
       *  ---------
       */
      let leftPercentage = 0;
      let middlePercentage = (dataRangeMax - rectifiedMin) / (interval * 86400 * 1000);
      let rightPercentage = (rectifiedMax - dataRangeMax) / (interval * 86400 * 1000);
      timeSliderPaddingLeft.setAttribute('style', `width: ${Math.round(leftPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('style', `width: ${Math.round(middlePercentage * sliderTotalLength) + 'px'}`);
      timeSliderPaddingRight.setAttribute('style', `width: ${Math.round(rightPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('min', rectifiedMin);
      timeSlider.setAttribute('max', dataRangeMax);
    } else if (dataRangeMax >= rectifiedMax && dataRangeMin >= rectifiedMin) {
      /**
       *
       *    -------------------
       *                ---------
       */
      let leftPercentage = (dataRangeMin - rectifiedMin) / (interval * 86400 * 1000);
      let middlePercentage = (rectifiedMax - dataRangeMin) / (interval * 86400 * 1000);
      let rightPercentage = 0;
      timeSliderPaddingLeft.setAttribute('style', `width: ${Math.round(leftPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('style', `width: ${Math.round(middlePercentage * sliderTotalLength) + 'px'}`);
      timeSliderPaddingRight.setAttribute('style', `width: ${Math.round(rightPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('min', dataRangeMin);
      timeSlider.setAttribute('max', rectifiedMax);
    } else if (dataRangeMax >= rectifiedMax && dataRangeMin <= rectifiedMin) {
      /**
       *
       *    -------------------
       *  -----------------------
       */
      let leftPercentage = 0;
      let middlePercentage = 1;
      let rightPercentage = 0;
      timeSliderPaddingLeft.setAttribute('style', `width: ${Math.round(leftPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('style', `width: ${Math.round(middlePercentage * sliderTotalLength) + 'px'}`);
      timeSliderPaddingRight.setAttribute('style', `width: ${Math.round(rightPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('min', rectifiedMin);
      timeSlider.setAttribute('max', rectifiedMax);
    }

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

  onMount(_ => {
    console.log(document.querySelector('#time_slider'));
    document.querySelector('#time_slider').addEventListener('input', event => {
      console.log(event.target);
      // if (value < dataRangeMin && rectifiedMin <= dataRangeMin) {
      //   document.querySelector('#time_slider').value = dataRangeMin;
      // } else if (value > dataRangeMax && rectifiedMax >= dataRangeMax) {
      //   document.querySelector('#time_slider').value = dataRangeMax;
      // }
    });
  });

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
    margin-right: 10px;
    color: var(--grey);
  }

  #timeSliderPaddingLeft,
  #timeSliderPaddingRight {
    /* flex-grow: 1; */
    height: 6px;
    padding: 0;
    border-style: none;
    /* background: #7e7e7e; */
    background: repeating-linear-gradient(-45deg, #666, #666 2px, #eee 2px, #eee 4px);
    outline: none;
    opacity: 0.7;
  }

  .slider {
    /* flex-grow: 1; */
    -webkit-appearance: none;
    width: 320px;
    height: 6px;
    padding: 0;
    border-style: none;
    background: #d3d3d3;
    outline: none;
    opacity: 0.7;
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
  <p>{formatTime(new Date(rectifiedMin))}</p>
  <div id="timeSliderPaddingLeft" bind:this={timeSliderPaddingLeft} />
  <input
    id="time_slider"
    bind:this={timeSlider}
    type="range"
    min={rectifiedMin}
    max={rectifiedMax}
    step={86400000}
    on:mouseup={sliderOnMouseUp}
    class="slider"
    bind:value={rectifiedVal} />
  <div id="timeSliderPaddingRight" bind:this={timeSliderPaddingRight} />
  <p>{formatTime(new Date(rectifiedMax))}</p>

  {#if $currentDataReadyOnMay === false}
    <div class="loader-container">
      <div class="loader" />
    </div>
  {/if}

</div>
