<script>
  import {
    currentSensor,
    currentLevel,
    currentDate,
    levelList,
    currentSensorEntry,
    groupedSensorList,
  } from '../stores';
  import { formatAPITime, parseAPITime } from '../data';
  import SensorDatePicker from './SensorDatePicker.svelte';

  export let levels = levelList;
  export let className = '';
  export let showDate = true;
  $: selectedDate = parseAPITime($currentDate);
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
  .options {
    position: relative;
    display: flex;
    margin: 0.3em;
  }

  .option-wrapper {
    align-items: center;
    display: flex;
    flex: 1 1 auto;
    max-width: 390px;
  }

  .option-title {
    margin: 0 5px;
    color: #444;
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    .options {
      max-width: unset;
    }
    .option-wrapper {
      padding: 0 0.1em;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: space-between;
    }
  }
</style>

<div class="options base-font-size container-bg container-style {className}">
  <div class="option-wrapper">
    <span class="option-title">Displaying</span>
    <select
      id="option-indicator"
      aria-label="indicator options"
      class="option-picker indicators base-font-size"
      bind:value={$currentSensor}>
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
  <div class="option-wrapper">
    <span class="option-title">for</span>
    <select
      id="option-geo-level"
      aria-label="geographic level"
      class="option-picker geo-level base-font-size"
      bind:value={$currentLevel}>
      {#each levels as level}
        <option value={level.id} disabled={!$currentSensorEntry.levels.includes(level.id)}>{level.labelPlural}</option>
      {/each}
    </select>
  </div>
  {#if showDate}
    <div class="option-wrapper">
      <span class="option-title">on</span>
      <SensorDatePicker sensor={$currentSensorEntry} bind:value={selectedDate} />
    </div>
  {/if}
</div>
