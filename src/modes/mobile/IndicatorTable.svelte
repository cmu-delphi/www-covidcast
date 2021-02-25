<script>
  import { groupedSensorList, sensorList } from '../../stores/constants';
  import IndicatorTableRow from './IndicatorTableRow.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import { SensorParam } from '../../stores/params';
  import { formatDateShortNumbers } from '../../formats';
  import filterIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/filter.svg';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;

  function computeDataSources() {
    const map = new Map();
    for (const sensor of sensorList) {
      const e = map.get(sensor.id);
      if (e) {
        e.push(sensor);
      } else {
        map.set(sensor.id, [sensor]);
      }
    }
    return Array.from(map)
      .map((d) => ({ name: d[0], sensors: d[1] }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const dataSources = computeDataSources();

  let selectedDatasource = '';

  $: {
    if (selectedDatasource === 'all') {
      selectedDatasource = '';
    }
  }
</script>

<style>
  .icon-wrapper {
    margin-top: 1em;
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
    color: #d3d4d8;
  }

  .icon-wrapper .uk-select {
    padding-left: 50px !important;
    padding-top: 5px;
    padding-bottom: 5px;
    border-radius: 3px;
    border: 1px solid #d3d4d8;
  }
</style>

<FancyHeader sub="Indicators">COVID-19</FancyHeader>

<div class="icon-wrapper">
  <span>
    <span class="inline-svg-icon">
      {@html filterIcon}
    </span>
  </span>
  <select class="uk-select" bind:value={selectedDatasource}>
    <option value="" disabled hidden>Filter by</option>
    {#each dataSources as ds}
      <option value={ds.name}>{ds.name} ({ds.sensors.length})</option>
    {/each}
    <option value="all">All Indicators ({sensorList.length})</option>
  </select>
</div>

<table class="mobile-table">
  <thead>
    <tr>
      <th class="mobile-th"><span>Indicator</span></th>
      <th class="mobile-th uk-text-right"><span>Change Last 7 days</span></th>
      <th class="mobile-th uk-text-right"><span>Value</span></th>
      <th class="mobile-th uk-text-right">
        <span>historical trend</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(date.sparkLineTimeFrame.min)} </span>
          <span> {formatDateShortNumbers(date.sparkLineTimeFrame.max)} </span>
        </div>
      </th>
      <th class="mobile-th" />
    </tr>
  </thead>
  {#each groupedSensorList as group}
    {#if !selectedDatasource || selectedDatasource === 'all' || group.sensors.some((d) => d.id === selectedDatasource)}
      <tbody>
        <tr class="row-group">
          <th class="mobile-h3" colspan="5">{group.label}</th>
        </tr>
        {#each group.sensors as sensor}
          {#if !selectedDatasource || selectedDatasource === 'all' || selectedDatasource === sensor.id}
            <IndicatorTableRow sensor={new SensorParam(sensor)} {date} {region} />
          {/if}
        {/each}
      </tbody>
    {/if}
  {/each}
</table>
