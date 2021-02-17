<script>
  import { nameInfos, nationInfo } from '../../maps';
  import { currentRegionInfo, currentSensorEntry, currentDateObject, currentRegion } from '../../stores';
  import SurveyParameters from '../survey/SurveyParameters.svelte';
  import GeoTable from './GeoTable.svelte';
  import { findDateRow, toTimeValue } from '../mobile/utils';
  import '../mobile/common.css';
  import { addMissing, fetchTimeSlice } from '../../data';
  import { timeWeek } from 'd3-time';
  import { primaryValue } from '../../stores/constants';
  import { generateSparkLine } from '../../specs/lineSpec';
  import RegionMap from '../mobile/RegionMap.svelte';
  import HistoryLineChart from '../mobile/HistoryLineChart.svelte';
  import chevronDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
  import chevronUpIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-up.svg';

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
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = generateSparkLine({ valueField: valueKey });

  let showNeighbors = false;
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
  .popup-button {
    border: none;
    background: none;
    font-weight: inherit;
    text-transform: uppercase;
    color: inherit;
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
      <h2>{sensor.name}</h2>
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
    <div class="grid-3-11">
      {#if showNeighbors}
        <GeoTable {sensor} {params} />
        <div class="uk-text-center">
          <button class="popup-button" on:click={() => (showNeighbors = false)}>
            <span class="inline-svg-icon">
              {@html chevronUpIcon}
            </span>
            Hide
          </button>
        </div>
      {:else}
        <div class="uk-text-center">
          <button class="popup-button" on:click={() => (showNeighbors = true)}>
            <span class="inline-svg-icon">
              {@html chevronDownIcon}
            </span>
            Neighboring Areas
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
