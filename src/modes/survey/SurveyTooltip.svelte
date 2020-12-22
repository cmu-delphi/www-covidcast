<script>
  import { formatDateShort } from '../../formats';
  import { formatValue } from './format';

  /**
   * @type {import('./questions').Question}
   */
  export let question;

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow}
   */
  export let item;
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
        <td class="right">{formatValue(item.value)} {question.unit}</td>
      </tr>
    </tbody>
  </table>
</div>
