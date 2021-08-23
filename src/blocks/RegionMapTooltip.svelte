<script>
  import { formatDateShortDayOfWeekAbbr, formatWeek } from '../formats';
  import { levelMegaCounty } from '../stores/constants';
  import { getStateOfCounty } from '../data/regions';
  import SensorValue from '../components/SensorValue.svelte';

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow & import('../../data/regions').NameInfo}
   */
  export let item;

  /**
   * @type {import('../../stores/params').SensorParam}
   */
  export let sensor;

  export let regionSetter = null;

  $: state = item != null && (item.level === 'county' || item.level === 'mega-county') ? getStateOfCounty(item) : null;

  function changeRegion() {
    if (regionSetter) {
      regionSetter(item, true);
    }
  }
  function changeRegionToState() {
    if (regionSetter) {
      regionSetter(state, true);
    }
  }
</script>

<div
  aria-label="tooltip"
  class="tooltip"
  class:hidden
  on:touchstart|stopPropagation={() => undefined}
  on:mousedown|stopPropagation={() => undefined}
>
  <h5>
    {#if item && regionSetter && item.level !== levelMegaCounty.id}
      <a class="uk-link-muted" href="?region={item.propertyId}" on:click|preventDefault={changeRegion}>
        {item.displayName}
      </a>
    {:else if item}
      {item.displayName}
    {:else}
      N/A
    {/if}
  </h5>
  <table>
    {#if state}
      <tr>
        <th>State</th>
        <td>
          <a class="uk-link-muted" href="?region={state.propertyId}" on:click|preventDefault={changeRegionToState}>
            {state.displayName}
          </a>
        </td>
      </tr>
    {/if}
    <tr>
      <th
        >{sensor && sensor.isWeeklySignal
          ? formatWeek(item.week_value)
          : formatDateShortDayOfWeekAbbr(item.date_value)}</th
      >
      <td>
        <SensorValue {sensor} value={item.value} medium />
      </td>
    </tr>
  </table>
</div>

<style>
  .hidden {
    display: none;
  }

  h5 {
    margin: 0;
    padding: 0;
  }

  th {
    text-align: left;
  }
  td {
    text-align: right;
  }
</style>
