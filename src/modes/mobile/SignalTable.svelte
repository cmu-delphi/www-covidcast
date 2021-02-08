<script>
  import { groupedSensorList } from '../../stores/constants';
  import SignalTableRow from './SignalTableRow.svelte';

  /**
   * @type {import("../utils").Params}
   */
  export let params;
</script>

<style>
  table {
    border-collapse: collapse;
  }

  thead > tr {
    border-bottom: 1px solid #f0f1f3;
  }
  thead > tr > th {
    padding: 0.75rem 4px;
  }
  tbody {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  tbody > :global(tr > *) {
    padding: 0.75rem 4px;
    vertical-align: top;
  }

  tbody > :global(tr):not(:last-of-type) {
    border-bottom: 1px solid #f0f1f3;
  }
  tbody > .row-group {
    border-bottom: none;
  }
</style>

<h2 class="mobile-h2">COVID-19 Signals</h2>

<table>
  <thead>
    <tr>
      <th class="mobile-th"><span>Measurement</span></th>
      <th class="mobile-th uk-text-right"><span>Change Last 7 days</span></th>
      <th class="mobile-th uk-text-right"><span>per 100k</span></th>
      <th class="mobile-th uk-text-right"><span>historical trend</span></th>
    </tr>
  </thead>
  {#each groupedSensorList as group}
    <tbody>
      <tr class="row-group">
        <th class="mobile-h3" colspan="4">{group.label}</th>
      </tr>
      {#each group.sensors as sensor}
        <SignalTableRow {sensor} {params} />
      {/each}
    </tbody>
  {/each}
</table>
