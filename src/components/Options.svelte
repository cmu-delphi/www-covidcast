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
                value={sensor.key}
              >
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
      <SensorDatePicker sensor={$currentSensorEntry} bind:value={selectedDate} />
    </div>
  {/if}
</div>

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
