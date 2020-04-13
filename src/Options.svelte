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
            <option value={sensor}>{sensor}</option>
          {/each}
        </select>
      </div>

      <div class="pure-u-1 pure-u-md-1-2">
        <label for="level">Select level:</label>
        <select id="level" bind:value={$currentLevel}>
          {#each $levels as level}
            <option value={level}>{level}</option>
          {/each}
        </select>
      </div>
    </div>
  </form>
</div>

<!-- keeping this button-based implementation in case the dropdown implementation above is not what we want -->

<!-- <div class="options-group">
  <h6>Select sensor:</h6>
  <div class="pure-button-group">
    {#each $sensors as sensor}
      <button
        class="pure-button {$currentSensor === sensor ? 'pure-button-active' : ''}"
        on:click={_ => currentSensor.set(sensor)}>
        {sensor}
      </button>
    {/each}
  </div>
</div>
<div class="options-group">
  <h6>Select level:</h6>
  <div class="pure-button-group">
    {#each $levels as level}
      <button
        class="pure-button {$currentLevel === level ? 'pure-button-active' : ''}"
        on:click={_ => currentLevel.set(level)}>
        {level}
      </button>
    {/each}
  </div>
</div> -->
