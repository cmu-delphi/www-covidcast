<script>
  import { groupedSensorList } from '../../stores/constants';
  import IndicatorTableRow from './IndicatorTableRow.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import { asSensorParam } from '../../stores/params';
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
</script>

<FancyHeader sub="Indicators">COVID-19</FancyHeader>

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
        <IndicatorTableRow sensor={asSensorParam(sensor)} {date} {region} />
      {/each}
    </tbody>
  {/each}
</table>
