<script>
  import { groupedSensorList } from '../../stores/constants';
  import IndicatorTableRow from './IndicatorTableRow.svelte';

  /**
   * @type {import("../utils").Params}
   */
  export let params;
</script>

<style>
  tbody > .row-group {
    border-bottom: none;
  }
</style>

<h2 class="mobile-h2">COVID-19 Indicators</h2>

<table class="mobile-table">
  <thead>
    <tr>
      <th class="mobile-th"><span>Indicator</span></th>
      <th class="mobile-th uk-text-right"><span>Change Last 7 days</span></th>
      <th class="mobile-th uk-text-right"><span>per 100k</span></th>
      <th class="mobile-th uk-text-right"><span>historical trend</span></th>
      <th class="mobile-th" />
    </tr>
  </thead>
  {#each groupedSensorList as group}
    <tbody>
      <tr class="row-group">
        <th class="mobile-h3" colspan="5">{group.label}</th>
      </tr>
      {#each group.sensors as sensor}
        <IndicatorTableRow {sensor} {params} />
      {/each}
    </tbody>
  {/each}
</table>
