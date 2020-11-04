<script>
  import {
    currentSensor,
    currentLevel,
    currentDate,
    times,
    levelList,
    currentSensorEntry,
    groupedSensorList,
    isMobileDevice,
  } from '../stores';
  import Datepicker from './Calendar/Datepicker.svelte';
  import { timeFormat } from 'd3-time-format';
  import { timeDay } from 'd3-time';
  import { formatAPITime, parseAPITime } from '../data';

  $: formatTime = $isMobileDevice ? timeFormat('%x') : timeFormat('%B %-d, %Y');

  export let levels = levelList;
  export let className = '';
  export let showDate = true;
  $: selectedDate = parseAPITime($currentDate);
  /**
   * @type {[Date, Date]}
   */
  $: startEndDates = [];
  $: if ($times !== null) {
    const dates = $times.get($currentSensor);
    startEndDates = dates ? dates.map(parseAPITime) : [];
  }
  $: if (selectedDate !== undefined) {
    currentDate.set(formatAPITime(selectedDate));
  }
  $: levelIds = new Set(levels.map((l) => l.id));
  $: filteredSensorGroups = groupedSensorList
    .map((g) => ({
      label: g.label,
      sensors: g.sensors.filter((d) => d.levels.some((l) => levelIds.has(l))),
    }))
    .filter((d) => d.sensors.length > 0);
</script>

<style>
  .block {
    display: flex;
    align-items: center;
  }

  .block .uk-form-label {
    margin-right: 1em;
  }

  .block .uk-form-controls {
    flex-grow: 1;
  }
</style>

<div class="container-bg container-style uk-grid-small {className}" data-uk-grid>
  <div class="uk-width-1-1 uk-width-1-{showDate ? '3' : '2'}@m block">
    <span class="uk-form-label">Displaying</span>
    <div class="uk-form-controls">
      <select id="option-indicator" aria-label="indicator options" class="uk-select" bind:value={$currentSensor}>
        {#each filteredSensorGroups as sensorGroup}
          <optgroup label={sensorGroup.label}>
            {#each sensorGroup.sensors as sensor}
              <option
                title={typeof sensor.tooltipText === 'function' ? sensor.tooltipText() : sensor.tooltipText}
                value={sensor.key}>
                {sensor.name}
              </option>
            {/each}
          </optgroup>
        {/each}
      </select>
    </div>
  </div>
  <div class="uk-width-1-1 uk-width-1-{showDate ? '3' : '2'}@m block">
    <span class="uk-form-label">for</span>
    <div class="uk-form-controls">
      <select id="option-geo-level" aria-label="geographic level" class="uk-select" bind:value={$currentLevel}>
        {#each levels as level}
          <option value={level.id} disabled={!$currentSensorEntry.levels.includes(level.id)}>
            {level.labelPlural}
          </option>
        {/each}
      </select>
    </div>
  </div>
  {#if showDate}
    <div class="uk-width-1-1 uk-width-1-3@m block">
      <span class="uk-form-label">on</span>
      <div class="uk-form-controls">
        {#if selectedDate != null && startEndDates.length !== 0}
          <Datepicker
            bind:selected={selectedDate}
            start={startEndDates[0]}
            end={startEndDates[1]}
            formattedSelected={formatTime(selectedDate)}>
            <button aria-label="selected date" class="uk-input" on:>{formatTime(selectedDate)}</button>
          </Datepicker>
        {:else}<button aria-label="selected date" class="uk-input" on:>{formatTime(selectedDate)}</button>{/if}
        <div class="uk-button-group">
          <button
            class="uk-button uk-button-default uk-button-small"
            disabled={selectedDate == null || startEndDates.length === 0 || selectedDate <= startEndDates[0]}
            title="Go to the previous day"
            on:click={() => (selectedDate = timeDay.offset(selectedDate, -1))}
            data-uk-icon="icon: chevron-left" />
          <button
            class="uk-button uk-button-default uk-button-small"
            disabled={selectedDate == null || startEndDates.length === 0 || selectedDate.valueOf() === startEndDates[1].valueOf()}
            title="Go to the latest date for which '{$currentSensorEntry.name}' is available"
            on:click={() => (selectedDate = startEndDates[1])}
            data-uk-icon="icon: calendar" />
          <button
            class="uk-button uk-button-default uk-button-small"
            disabled={selectedDate == null || startEndDates.length === 0 || selectedDate >= startEndDates[1]}
            title="Go to the next day"
            on:click={() => (selectedDate = timeDay.offset(selectedDate, 1))}
            data-uk-icon="icon: chevron-right" />
        </div>
      </div>
    </div>
  {/if}
</div>
