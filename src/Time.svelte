<script>
  import { onMount } from 'svelte';
  import { currentDate, times, currentSensor, currentDataReadyOnMay } from './stores.js';
  import * as d3 from 'd3';

  let timeSliderPaddingLeft;
  let timeSliderPaddingRight;
  let timeSlider;
  let selectedDateDisplay;

  let parseTime = d3.timeParse('%Y%m%d');
  let formatTime = d3.timeFormat('%B %d, %Y');
  let formatTimeWithoutYear = d3.timeFormat('%B %d');

  let interval = 14;
  let rectifiedRange = interval;
  let sliderTotalLength = 320; // in px
  let canLoadMore = true;

  let val = $currentDate;
  let min = $currentDate;
  let max = $currentDate;

  let today = new Date(
    new Date()
      .toJSON()
      .slice(0, 10)
      .replace(/-/g, '/'),
  );
  let yesterday = new Date(today.getTime() - 86400 * 1000);

  let rectifiedVal = parseTime(val).getTime();
  let rectifiedMax = yesterday.getTime();
  let rectifiedMin = rectifiedMax - rectifiedRange * 86400 * 1000;

  let dataRangeMin = parseTime(min).getTime();
  let dataRangeMax = parseTime(max).getTime();

  let prettyDate = '';
  $: prettyDate = formatTime(new Date(rectifiedVal));

  currentDate.subscribe(d => {
    val = d;
    rectifiedVal = parseTime(val).getTime();
  });
  times.subscribe(t => (t ? update($currentSensor, t) : ''));
  currentSensor.subscribe(s => ($times ? update(s, $times, true) : ''));

  function update(s, t, newSensor = false) {
    max = t.get(s)[1];
    min = t.get(s)[0];
    dataRangeMin = parseTime(min).getTime();
    dataRangeMax = parseTime(max).getTime();

    console.log('current', $currentDate);
    console.log('rectfiedmin:', calculateValFromRectified(rectifiedMin));

    if (newSensor) {
      if (
        dataRangeMin <= rectifiedMin &&
        parseTime($currentDate).getTime() >= rectifiedMin &&
        parseTime($currentDate).getTime() <= rectifiedMax
      ) {
        console.log('fine not to change slider range');
      } else {
        // reset range
        rectifiedRange = interval;
        rectifiedMin = rectifiedMax - rectifiedRange * 86400 * 1000;
      }
    }

    updateSliderUI();

    // currentDate.set(max);
    // console.log('set to max');
  }

  function updateSliderUI() {
    if (dataRangeMax <= rectifiedMax && dataRangeMin >= rectifiedMin) {
      /**
       * fall within
       *    -------------------
       *        ---------
       */
      let leftPercentage = (dataRangeMin - rectifiedMin) / (rectifiedRange * 86400 * 1000);
      let middlePercentage = (dataRangeMax - dataRangeMin) / (rectifiedRange * 86400 * 1000);
      let rightPercentage = (rectifiedMax - dataRangeMax) / (rectifiedRange * 86400 * 1000);
      timeSliderPaddingLeft.setAttribute('style', `width: ${Math.round(leftPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('style', `width: ${Math.round(middlePercentage * sliderTotalLength) + 'px'}`);
      timeSliderPaddingRight.setAttribute('style', `width: ${Math.round(rightPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('min', dataRangeMin);
      timeSlider.setAttribute('max', dataRangeMax);
      canLoadMore = false;
    } else if (dataRangeMax <= rectifiedMax && dataRangeMin <= rectifiedMin) {
      /**
       *
       *    -------------------
       *  ---------
       */
      let leftPercentage = 0;
      let middlePercentage = (dataRangeMax - rectifiedMin) / (rectifiedRange * 86400 * 1000);
      let rightPercentage = (rectifiedMax - dataRangeMax) / (rectifiedRange * 86400 * 1000);
      timeSliderPaddingLeft.setAttribute('style', `width: ${Math.round(leftPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('style', `width: ${Math.round(middlePercentage * sliderTotalLength) + 'px'}`);
      timeSliderPaddingRight.setAttribute('style', `width: ${Math.round(rightPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('min', rectifiedMin);
      timeSlider.setAttribute('max', dataRangeMax);
      canLoadMore = true;
    } else if (dataRangeMax >= rectifiedMax && dataRangeMin >= rectifiedMin) {
      /**
       *
       *    -------------------
       *                ---------
       */
      let leftPercentage = (dataRangeMin - rectifiedMin) / (rectifiedRange * 86400 * 1000);
      let middlePercentage = (rectifiedMax - dataRangeMin) / (rectifiedRange * 86400 * 1000);
      let rightPercentage = 0;
      timeSliderPaddingLeft.setAttribute('style', `width: ${Math.round(leftPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('style', `width: ${Math.round(middlePercentage * sliderTotalLength) + 'px'}`);
      timeSliderPaddingRight.setAttribute('style', `width: ${Math.round(rightPercentage * sliderTotalLength) + 'px'}`);
      timeSlider.setAttribute('min', dataRangeMin);
      timeSlider.setAttribute('max', rectifiedMax);
      canLoadMore = false;
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
      canLoadMore = true;
    }

    ////console.log(canLoadMore);
  }

  function calculateValFromRectified(rectified) {
    let tempDate = new Date(rectified);
    let year = tempDate.getFullYear();
    let month = ('0' + (tempDate.getMonth() + 1)).slice(-2);
    let date = ('0' + tempDate.getDate()).slice(-2);
    return year + month + date;
  }

  function sliderOnChange() {
    window.performance.mark('start sliderOnChange');
    // only update currentDataReadyOnMay when the date actually changed
    currentDate.update(d => {
      let newDate = calculateValFromRectified(rectifiedVal);
      if (d !== newDate) {
        currentDataReadyOnMay.set(false);
      }
      return newDate;
    });
    window.performance.measure('sliderOnChange', 'start sliderOnChange');
  }

  function loadMoreDataRange() {
    rectifiedRange += interval;
    rectifiedMin = rectifiedMax - rectifiedRange * 86400 * 1000;
    if (rectifiedMin < dataRangeMin) {
      rectifiedMin = dataRangeMin;
    }

    updateSliderUI();
  }

  // currentDataReadyOnMay.subscribe(d => ////console.log('map set:', d));
</script>

<style>
  .time {
    display: inline-flex;
    align-items: center;
    width: 100%;
    position: relative;
  }

  .selected-date {
    position: absolute;
    top: -20px;
    left: 10px;
    /* width: 300px; */
    height: 24px;
    /* background-color: lightgray; */
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .load-more-button {
    position: absolute;
    bottom: -18px;
    left: 10px;

    margin: 0;
    font-size: 0.7rem;
    background-color: #fff;
    border-style: solid;
    border-color: #dbdbdb;
    border-width: 1px;
    color: #666666;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: calc(0.3rem - 1px);
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-top: calc(0.3rem - 1px);

    transition: all 0.1s ease-in;
  }

  .load-more-button:hover {
    background-color: #666666;
    color: #fff;
  }

  .load-more-button:focus {
    outline: none;
  }

  .load-more-button:disabled {
    background-color: rgb(211, 211, 211);
    color: #666666;
    cursor: not-allowed;
    font-size: 0.7rem;
    transform: none;
  }

  /* .load-more-button:disabled:hover {
    animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    transform: translate3d(0, 0, 0);
  } */

  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-1px, 0, 0);
    }

    20%,
    80% {
      transform: translate3d(2px, 0, 0);
    }

    30%,
    50%,
    70% {
      transform: translate3d(-4px, 0, 0);
    }

    40%,
    60% {
      transform: translate3d(4px, 0, 0);
    }
  }

  .time p {
    flex-shrink: 0;
    margin-left: 10px;
    margin-right: 10px;
    color: var(--grey);
  }

  .time p.min-max {
    font-size: 0.8rem;
    color: #666;
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

  #timeSliderPaddingLeft {
    position: relative;
  }

  .slider {
    /* flex-grow: 1; */
    -webkit-appearance: none;
    width: 320px;
    height: 6px;
    padding: 0;
    border: none;
    background: #d3d3d3;
    outline: none;
    opacity: 0.9;
    margin: 0;
  }

  .slider::-moz-focus-outer {
    border: 0;
  }

  /* Special styling for WebKit/Blink */
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--red);
    cursor: pointer;
  }

  /* All the same stuff for Firefox */
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--red);
    cursor: pointer;
  }

  /* All the same stuff for IE */
  .slider::-ms-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--red);
    cursor: pointer;
  }

  .loader-container {
    /* position: absolute;
    top: 0;
    bottom: 0;
    right: -40px;
    width: 40px; */

    height: 100%;

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

<div aria-label="date" class="time">
  <div aria-live="assertive" id="time-label" class="selected-date" bind:this={selectedDateDisplay}>
    Viewing estimates for: {formatTimeWithoutYear(new Date(rectifiedVal))}
  </div>

  <button class="load-more-button" on:click={loadMoreDataRange} disabled={!canLoadMore}>Load 2 more weeks</button>

  <p aria-label="minimum value" class="min-max">{formatTime(new Date(rectifiedMin))}</p>
  <div id="timeSliderPaddingLeft" bind:this={timeSliderPaddingLeft} />
  <input
    aria-controls="time-label"
    id="time_slider"
    bind:this={timeSlider}
    type="range"
    min={rectifiedMin}
    max={rectifiedMax}
    step={86400000}
    aria-label={formatTimeWithoutYear(new Date(rectifiedVal))}
    on:mouseup={sliderOnChange}
    on:touchend={sliderOnChange}
    on:keyup={sliderOnChange}
    class="slider"
    bind:value={rectifiedVal} />
  <div id="timeSliderPaddingRight" bind:this={timeSliderPaddingRight} />
  <p aria-label="maximum value" class="min-max">{formatTime(new Date(rectifiedMax))} (Yesterday)</p>

  {#if $currentDataReadyOnMay === false}
    <div class="loader-container">
      <div class="loader" />
    </div>
  {/if}

</div>
