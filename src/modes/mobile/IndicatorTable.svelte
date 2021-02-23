<script>
  import { groupedSensorList } from '../../stores/constants';
  import IndicatorTableRow from './IndicatorTableRow.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import { createSensorParam } from '../../stores/params';
  import { formatDateShortNumbers } from '../../formats';

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
      <th class="mobile-th uk-text-right"><span>Value</span></th>
      <th class="mobile-th uk-text-right">
        <span>historical trend</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(date.sparkLine.min)} </span>
          <span> {formatDateShortNumbers(date.sparkLine.max)} </span>
        </div>
      </th>
      <th class="mobile-th" />
    </tr>
  </thead>
  {#each groupedSensorList as group}
    <tbody>
      <tr class="row-group">
        <th class="mobile-h3" colspan="5">{group.label}</th>
      </tr>
      {#each group.sensors as sensor}
        <IndicatorTableRow sensor={createSensorParam(sensor)} {date} {region} />
      {/each}
    </tbody>
  {/each}
</table>
