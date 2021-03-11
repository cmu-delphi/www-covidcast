<script>
  import { groupedSensorList } from '../../stores';
  import caretDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/caret-down.svg';
  import searchIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/search.svg';

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

<div class="uk-container content-grid parameters">
  <div class="dropdown-container grid-3-11" class:open on:click|stopPropagation={() => undefined}>
    <button type="button" class="trigger" on:click={() => (open = !open)}>
      <span class="inline-svg-icon search-icon">
        {@html searchIcon}
      </span>
      {sensor.value.name}
      <span class="inline-svg-icon down-icon">
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
                  on:click|preventDefault={() => switchSensor(sensor)}>{sensor.name}</a
                >
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  </div>
</div>
<svelte:window
  on:click={() => {
    if (open) {
      open = false;
    }
  }}
/>

<style>
  .parameters {
    margin-top: 6px;
    margin-bottom: 6px;
  }
  .dropdown-container {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
  }
  .trigger {
    position: relative;
    background: white;
    text-align: left;
    font-weight: 400;
    height: 50px;
    font-size: 0.75rem;
    line-height: 1rem;
    padding: 10px 6px 10px 35px;
    border: 1px solid #d3d4d8;
    color: #666;
    border-radius: 4px;
  }

  .down-icon,
  .search-icon {
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

  .down-icon > :global(svg),
  .search-icon > :global(svg) {
    width: 20px;
    height: 20px;
  }

  .content {
    display: none;
    border: 1px solid #d3d4d8;
    border-radius: 3px;
    list-style: none;
    background: white;
    margin: 6px 0;
    padding-bottom: 0.5em;
  }

  .down-icon {
    left: unset;
    right: 0;
  }

  .content ul {
    list-style: none;
  }

  .open > .content {
    display: block;
  }
</style>
