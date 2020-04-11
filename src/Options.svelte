<script>
  import { sensors, currentSensor, levels, currentLevel } from "./stores.js";
</script>

<div class="options-group">
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
</div>
