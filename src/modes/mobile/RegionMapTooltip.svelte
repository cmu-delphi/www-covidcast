<script>
  import { formatDateShort } from '../../formats';

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow & import('../../maps').NameInfo}
   */
  export let item;

  function f(v) {
    return v == null
      ? 'N/A'
      : v.toLocaleString(undefined, {
          maximumFractionDigits: 1,
        });
  }
</script>

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

<div aria-label="tooltip" class="tooltip" class:hidden>
  <h5>{item.displayName}</h5>
  <table>
    <tr>
      <th>{formatDateShort(item.date_value)}</th>
      <td>{f(item.value)}</td>
    </tr>
  </table>
</div>
