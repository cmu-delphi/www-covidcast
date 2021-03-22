<script>
  import { formatDateShort } from '../../formats';

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow}
   */
  export let item;

  export let prop = 'displayName';

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
  $: items =
    item && view
      ? view
          .data('values')
          .filter((d) => d.time_value === item.time_value)
          .sort((a, b) => a[prop].localeCompare(b[prop]))
      : [];

  function splitInGroups(items, len) {
    const groups = Array(len)
      .fill(0)
      .map(() => []);
    for (let i = 0; i < items.length; i++) {
      groups[i % len].push(items[i]);
    }
    return groups;
  }

  $: itemGroups = items.length < 8 ? items.map((i) => [i]) : splitInGroups(items, 8);
</script>

<div aria-label="tooltip" class="tooltip" class:hidden>
  <h5>{formatDateShort(item.date_value)}</h5>
  <table>
    {#each itemGroups as g}
      <tr>
        {#each g as i}
          <th>{i[prop]}</th>
          <td>{f(i.value)}</td>
        {/each}
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
