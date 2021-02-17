<script>
  import { groupedSensorList, sensorList } from '../../stores/constants';
  import IndicatorTableRow from './IndicatorTableRow.svelte';
  import filterIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/filter.svg';

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  const dataSources = [...new Set(sensorList.map((d) => d.id))].sort();

  let selectedDatasource = '';
</script>

<style>
  tbody > .row-group {
    border-bottom: none;
  }

  .icon-wrapper {
    position: relative;
  }
  .icon-wrapper > span {
    position: absolute;
    left: 0;
    width: 40px;
    top: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .icon-wrapper .uk-select {
    padding-left: 50px !important;
    padding-top: 5px;
    padding-bottom: 5px;
    border-radius: 3px;
    border: 1px solid #d3d4d8;
  }
</style>

<h2 class="mobile-h2">COVID-19 Indicators</h2>

<div class="icon-wrapper">
  <span>
    <span class="inline-svg-icon">
      {@html filterIcon}
    </span>
  </span>
  <select class="uk-select" bind:value={selectedDatasource}>
    <option value="">Filter by</option>
    {#each dataSources as ds}
      <option value={ds}>{ds}</option>
    {/each}
  </select>
</div>

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
    {#if !selectedDatasource || group.sensors.some((d) => d.id === selectedDatasource)}
      <tbody>
        <tr class="row-group">
          <th class="mobile-h3" colspan="5">{group.label}</th>
        </tr>
        {#each group.sensors as sensor}
          {#if !selectedDatasource || selectedDatasource === sensor.id}
            <IndicatorTableRow {sensor} {params} />
          {/if}
        {/each}
      </tbody>
    {/if}
  {/each}
</table>
