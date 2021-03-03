<script>
  import { formatDateShort } from '../../formats';
  import SensorValue from '../mobile/SensorValue.svelte';

  /**
   * @type {import('./questions').Question}
   */
  export let question;

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow}
   */
  export let item;
  /**
   * @type {import('../../stores/params').SensorParam}
   */
  export let sensor;
</script>

<style>
  .hidden {
    display: none;
  }

  th,
  td {
    border: none;
  }

  .right {
    text-align: right;
  }

  h5 {
    margin: 0;
    padding: 0;
  }
</style>

<div aria-label="tooltip" class="tooltip" class:hidden>
  <h5>{question.name}</h5>
  <table>
    <tbody>
      <tr>
        <th>Date</th>
        <td>{formatDateShort(item.date_value)}</td>
      </tr>
      <tr>
        <th>Value</th>
        <td class="right">
          <SensorValue {sensor} value={item.value} />
        </td>
      </tr>
    </tbody>
  </table>
</div>
