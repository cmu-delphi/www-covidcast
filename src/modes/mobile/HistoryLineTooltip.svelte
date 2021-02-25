<script>
  import { formatDateShortWeekdayAbbr } from '../../formats';

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow}
   */
  export let item;

  /**
   * @type {View}
   */
  export let view;

  function f(v) {
    return v == null
      ? 'N/A'
      : v.toLocaleString(undefined, {
          maximumFractionDigits: 1,
        });
  }
  $: items = item && view ? view.data('values').filter((d) => d.time_value === item.time_value) : [];
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
  <h5>{formatDateShortWeekdayAbbr(item.date_value)}</h5>
  <table>
    {#each items as i}
      <tr>
        <th>{i.displayName}</th>
        <td>{f(i.value)}</td>
      </tr>
    {/each}
  </table>
</div>
