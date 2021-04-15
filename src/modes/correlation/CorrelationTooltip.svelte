<script>
  import { lagToOffset } from '../../data/correlation';

  import { formatDateShortWeekdayAbbr } from '../../formats';
  import SensorValue from '../mobile/SensorValue.svelte';

  export let hidden = false;

  /**
   * @type {{x: number, y: number, x_date: Date, y_date: Date, x_entry: import('../../stores').EpiDataRow, y_entry: EpiDataRow}}
   */
  export let item;

  export let lag = 0;
  /**
   * @type {import('../../stores/params').SensorParam}
   */
  export let primary;
  /**
   * @type {import('../../stores/params').SensorParam}
   */
  export let secondary;
</script>

<div aria-label="tooltip" class="tooltip" class:hidden>
  <table>
    <tr>
      <th colspan="2">
        <h5>
          {primary.name}
        </h5>
      </th>
    </tr>
    <tr>
      <th>{formatDateShortWeekdayAbbr(item.x_date)}</th>
      <td>
        <SensorValue sensor={primary} value={item.x} medium />
      </td>
    </tr>
    <tr>
      <th colspan="2">
        <h5>
          {secondary.name}
          {lagToOffset(lag)}
        </h5>
      </th>
    </tr>
    <tr>
      <th>
        {formatDateShortWeekdayAbbr(item.y_date)}
      </th>
      <td>
        <SensorValue sensor={secondary} value={item.y} medium />
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
