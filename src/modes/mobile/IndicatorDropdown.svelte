<script>
  import { groupedSensorList } from '../../stores';
  import caretDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-down.svg';

  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;

  let open = false;

  function switchSensor(newSensor) {
    open = false;
    // debounce
    setTimeout(() => sensor.set(newSensor), 10);
  }
</script>

<style>
  .dropdown-container {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
  }
  .trigger {
    border: 1px solid #d3d4d8;
    border-radius: 3px;
    text-align: left;
    display: flex;
    align-items: center;
    background: none;
    outline: none;
    background: white;
    font-size: 0.875rem;
    line-height: 1;
    padding: 12px 4px;
    border-radius: 3px;
  }

  .trigger .inline-svg-icon {
    font-size: 80%;
    fill: #999;
  }

  .trigger > div {
    flex: 1 1 0;
  }

  .content {
    display: none;
    border: 1px solid #d3d4d8;
    border-radius: 3px;
    margin-top: 2px;
    padding: 0.5em;
    list-style: none;
  }

  .content ul {
    list-style: none;
  }

  .open > .content {
    display: block;
  }
</style>

<div class="dropdown-container" class:open on:click|stopPropagation={() => undefined}>
  <button type="button" class="trigger" on:click={() => (open = !open)}>
    <div>{sensor.value.name}</div>
    <span class="inline-svg-icon">
      {@html caretDownIcon}
    </span>
  </button>
  <ul class="content">
    {#each groupedSensorList as group}
      <li>
        <div class="mobile-h3">{group.label}</div>
        <ul>
          {#each group.sensors as sensor}
            <li>
              <a
                class="uk-text-muted"
                href="?sensor={sensor.key}"
                on:click|preventDefault={() => switchSensor(sensor)}>{sensor.name}</a>
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
  }} />
