<script>
  import { formatDateShortWeekdayAbbr } from '../../formats';
  import SensorValue from './SensorValue.svelte';

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow & import('../../data/regions').NameInfo}
   */
  export let item;

  /**
   * @type {import('../../stores/params').SensorParam}
   */
  export let sensor;
</script>

<div aria-label="tooltip" class="tooltip" class:hidden>
  <h5>{formatDateShortWeekdayAbbr(item.date_value)}</h5>
  <table>
    <tr>
      <th>{item.displayName}</th>
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
