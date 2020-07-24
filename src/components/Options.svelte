<script>
  import { sensorMap, currentSensor, currentLevel, currentDate, times, levelList } from '../stores';
  import Datepicker from './Calendar/Datepicker.svelte';
  import * as d3 from 'd3';

  const formatTime = d3.timeFormat('%B %-d, %Y');
  const convertDate = d3.timeFormat('%Y%m%d');
  const parseTime = d3.timeParse('%Y%m%d');

  // let selectedDate = writable(parseTime($currentDate));
  $: selectedDate = parseTime($currentDate);
  // if ($currentDate !== 20100420) {
  //   selectedDate = parseTime($currentDate);
  // }
  $: start_end_dates = [];

  $: if (selectedDate !== undefined) {
    currentDate.set(convertDate(selectedDate));
  }
  $: if ($times !== null) {
    start_end_dates = $times.get($currentSensor);
  }
</script>

<style>
  .options {
    position: relative;
    display: flex;
    align-items: center;
  }

  .option-title {
    margin: 0 5px;
    color: #444;
  }

  select,
  .calendar {
    background-color: #ececec;
    border-radius: 5px;
    border: none;
    color: #111;
    line-height: 1.3;
    padding: 0.4em 0.6em;
    width: auto;
    min-width: 0;

    -moz-appearance: none;
    -webkit-appearance: none;
    appearance: none;

    transition: all 0.1s ease-in;
    flex: 1 1 auto;
    white-space: nowrap;
  }

  select,
  .calendar {
    padding-right: 1.7em;
    background-image: linear-gradient(45deg, transparent 50%, gray 50%),
      linear-gradient(135deg, gray 50%, transparent 50%);
    background-position: calc(100% - 15px) calc(0.85em + 0px), calc(100% - 10px) calc(0.85em + 0px);
    background-size: 5px 5px, 5px 5px;
    background-repeat: no-repeat;
  }

  .calendar:hover,
  select:hover {
    background-color: #dcdcdc;
  }

  :global(.datepicker) {
    margin: unset;
  }
</style>

<div class="options">
  <label class="option-title base-font-size" for="option-indicator">Displaying</label>
  <select
    id="option-indicator"
    aria-label="indicator options"
    class="indicators base-font-size"
    bind:value={$currentSensor}>
    <optgroup label="Indicators">
      {#each Array.from($sensorMap.keys()).filter((d) => !$sensorMap.get(d).official) as sensor}
        <option title={$sensorMap.get(sensor).tooltipText} value={sensor}>{$sensorMap.get(sensor).name}</option>
      {/each}
    </optgroup>
    <optgroup label="Official Reports">
      {#each Array.from($sensorMap.keys()).filter((d) => $sensorMap.get(d).official) as sensor}
        <option title={$sensorMap.get(sensor).tooltipText} value={sensor}>{$sensorMap.get(sensor).name}</option>
      {/each}
    </optgroup>
  </select>
  <label class="option-title base-font-size" for="option-geo-level">for</label>
  <select
    id="option-geo-level"
    aria-label="geographic level"
    class="geo-level base-font-size"
    bind:value={$currentLevel}>
    {#each levelList as level}
      <option value={level.id} disabled={!$sensorMap.get($currentSensor).levels.includes(level.id)}>
        {level.labelPlural}
      </option>
    {/each}
  </select>
  <label class="option-title base-font-size" for="option-date">on</label>
  {#if selectedDate != null && start_end_dates.length !== 0}
    <Datepicker
      bind:selected={selectedDate}
      start={parseTime(start_end_dates[0])}
      end={parseTime(start_end_dates[1])}
      formattedSelected={formatTime(selectedDate)}>
      <button id="option-date" class="calendar base-font-size" on:>{formatTime(selectedDate)}</button>
    </Datepicker>
  {/if}
</div>
