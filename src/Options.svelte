<script>
  import { sensors, currentSensor, levels, currentLevel } from "./stores.js";
</script>

<style>
  .pure-u-1 {
    box-sizing: border-box;
    padding: 5px;
  }
</style>

<div class="options">
  <form class="pure-form">
    <div class="pure-g">
      <div class="pure-u-1 pure-u-md-1-2">
        <label for="sensor">Select sensor:</label>
        <select id="sensor" bind:value={$currentSensor}>
          {#each $sensors as sensor}
            <option value={sensor.id}>{sensor.name}</option>
          {/each}
        </select>
      </div>

      <div class="pure-u-1 pure-u-md-1-2">
        <label for="level">Select level:</label>
        <select id="level" bind:value={$currentLevel}>
          {#each $sensors.find(d => d.id === $currentSensor).levels as level}
            <option value={level}>{$levels[level]}</option>
          {/each}
        </select>
      </div>
    </div>
  </form>
</div>
