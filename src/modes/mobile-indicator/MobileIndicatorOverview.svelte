<script>
  import { nameInfos, nationInfo } from '../../maps';
  import { currentRegionInfo, currentSensorEntry, currentDateObject, currentRegion, currentMode } from '../../stores';
  import SurveyParameters from '../survey/SurveyParameters.svelte';
  import GeoTable from './GeoTable.svelte';
  import { findDateRow, toTimeValue } from '../mobile/utils';
  import '../mobile/common.css';
  import { addMissing, fetchTimeSlice } from '../../data';
  import { timeWeek } from 'd3-time';
  import { primaryValue } from '../../stores/constants';
  import RegionMap from '../mobile/RegionMap.svelte';
  import HistoryLineChart from '../mobile/HistoryLineChart.svelte';
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { modeByID } from '..';

  $: params = {
    region: $currentRegionInfo || nationInfo,
    date: $currentDateObject,
    timeValue: toTimeValue($currentDateObject),
    setRegion: (region) => {
      currentRegion.set(region.propertyId);
    },
  };
  $: sensor = $currentSensorEntry;

  function loadData(sensor, params) {
    const { region, date } = params;
    if (!region || !date) {
      return null;
    }
    const startDate = timeWeek.offset(date, -4);
    return fetchTimeSlice(sensor, region.level, region.propertyId, startDate, date, true, {
      displayName: region.displayName,
      geo_value: region.propertyId,
    }).then((rows) => addMissing(rows, sensor));
  }

  function findCurrentRow(data, date) {
    return data ? data.then((rows) => findDateRow(date, rows)) : null;
  }

  $: data = loadData(sensor, params);
  $: currentRow = findCurrentRow(data, params.date);
  $: valueKey = primaryValue(sensor, {});

  function switchMode() {
    currentMode.set(modeByID.mobile);
  }
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    overflow: auto;
  }

  .chart-line,
  .chart-map {
    position: relative;
  }
  .chart-line > :global(*) {
    width: 100%;
    height: 150px;
  }
  .chart-map > :global(*) {
    width: 100%;
    height: 300px;
  }

  .popup-table {
    margin: 2em 0;
    border-collapse: collapse;
    font-size: 0.75rem;
    line-height: 1rem;
    width: 100%;
  }

  .popup-table > tr > * {
    padding: 0.5rem 4px;
    vertical-align: top;
  }

  .popup-table > tr:not(:last-of-type) {
    border-bottom: 1px solid #f0f1f3;
  }

  .popup-table-value {
    font-weight: 600;
    text-align: right;
  }
</style>

<div class="root">
  <SurveyParameters {sensor} items={nameInfos} defaultItem={nationInfo} />
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <h2>
        <a href="?mode=mobile" class="uk-link-text" on:click|preventDefault={switchMode}>
          <span class="inline-svg-icon">
            {@html chevronLeftIcon}
          </span>
        </a>
        {sensor.name}
      </h2>
      <div class="chart-map">
        <RegionMap {params} {sensor} />
      </div>
      <div class="chart-line">
        <HistoryLineChart {params} {sensor} />
      </div>
      <table class="popup-table">
        <tr>
          <td>Last 7 day trend</td>
          <td class="popup-table-value">TODO</td>
        </tr>
        <tr>
          <td>Last 7 day avg</td>
          <td class="popup-table-value">
            {#await currentRow}?{:then row}{row ? sensor.formatValue(row[valueKey]) : 'N/A'}{/await}
          </td>
        </tr>
        <tr>
          <td>Peak 7 day period</td>
          <td class="popup-table-value">TODO</td>
        </tr>
        <tr>
          <td>Record high</td>
          <td class="popup-table-value">TODO</td>
        </tr>
        <tr>
          <td>Record low</td>
          <td class="popup-table-value">TODO</td>
        </tr>
      </table>
    </div>
    <GeoTable {sensor} {params} />
  </div>
</div>
