<script>
  import { groupedSensorList } from '../stores';
  import caretDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-down.svg';

  /**
   * @type {import("../stores/params").SensorParam}
   */
  export let sensor;

  export let className = 'grid-3-11';

  export let allSensors = groupedSensorList;

  export let label = 'Indicator';

  let open = false;

  function switchSensor(newSensor) {
    open = false;
    // debounce
    setTimeout(() => sensor.set(newSensor), 10);
  }

  function stopPropagation(e) {
    if (open) {
      e.stopPropagation();
    }
  }
</script>

<div class="dropdown-container {className}" class:open on:click={stopPropagation}>
  <button type="button" class="trigger" on:click={() => (open = !open)}>
    {sensor.value.name}
    <span class="inline-svg-icon down-icon">
      {@html caretDownIcon}
    </span>
    <div class="dropdown-label">{label}</div>
  </button>
  <ul class="content">
    {#each allSensors as group}
      <li>
        <div class="mobile-h3">{group.label}</div>
        <ul>
          {#each group.sensors as sensor}
            <li>
              <a class="uk-text-muted" href="?sensor={sensor.key}" on:click|preventDefault={() => switchSensor(sensor)}
                >{sensor.name}</a
              >
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
</div>

<svelte:window
  on:click={() => {
    if (open) {
      open = false;
    }
  }}
/>

<style>
  .dropdown-container {
    margin-bottom: 6px;
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .trigger {
    position: relative;
    background: white;
    text-align: left;
    font-weight: 600;
    height: 50px;
    font-size: 0.875rem;
    line-height: 1rem;
    padding: 10px 6px 10px 24px;
    border: 1px solid #d3d4d8;
    color: #666;
    border-radius: 4px;
  }

  .down-icon {
    font-size: 80%;
    fill: #999;
    position: absolute;
    left: 0;
    top: 0;
    width: 35px;
    height: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }

  .down-icon > :global(svg) {
    width: 20px;
    height: 20px;
  }

  .content {
    position: absolute;
    left: 0;
    top: 100%;
    min-width: 100%;
    box-sizing: border-box;
    display: none;
    border: 1px solid #d3d4d8;
    border-radius: 3px;
    list-style: none;
    background: white;
    margin: 1px 0 0 0;
    /* padding: 6px 0 0.5em; */
    padding: 0.5em 1em 0.5em 1em;
    z-index: 1000;
  }

  .down-icon {
    left: unset;
    right: 0;
  }

  .content ul {
    list-style: none;
    padding-left: 1em;
  }

  .open > .content {
    display: block;
  }

  .dropdown-label {
    position: absolute;
    top: -0.7em;
    left: 24px;
    font-size: 0.75rem;
    padding: 2px;
    border-radius: 3px;
    background: white;
    font-weight: 400;
  }
</style>
