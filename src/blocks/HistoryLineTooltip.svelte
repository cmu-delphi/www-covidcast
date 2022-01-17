<script>
  import { formatDateShortDayOfWeekAbbr } from '../formats';
  import SensorValue from '../components/SensorValue.svelte';

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow}
   */
  export let item;

  /**
   * @type {View}
   */
  export let view;

  /**
   * @type {import('../../stores/params').SensorParam}
   */
  export let sensor;

  export let prop = 'displayName';

  $: items = item && view ? view.data('values').filter((d) => d.time_value === item.time_value) : [];
</script>

<div aria-label="tooltip" class="tooltip" class:hidden>
  <h5>{formatDateShortDayOfWeekAbbr(item.date_value)}</h5>
  <table>
    {#each items as i}
      <tr>
        <th>{i[prop]}</th>
        <td>
          <SensorValue {sensor} value={i.value} medium />
        </td>
      </tr>
    {/each}
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
