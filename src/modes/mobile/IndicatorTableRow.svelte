<script>
  import { addMissing, fetchTimeSlice } from '../../data';
  import { findDateRow, guessSensorColor } from './utils';
  import { primaryValue } from '../../stores/constants';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
  import { timeWeek } from 'd3-time';
  import SparkLineTooltip from './SparkLineTooltip.svelte';
  import HistoryLineChart from './HistoryLineChart.svelte';
  import RegionMap from './RegionMap.svelte';
  import GeoTable from './GeoTable.svelte';
  import circleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/circle.svg';
  import eyeHideIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/eye-slash.svg';
  import chevronDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
  import chevronUpIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-up.svg';
  import plusCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/plus-circle.svg';

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @type {import("../utils").Params}
   */
  export let params;

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
  $: spec = generateSparkLine({ valueField: valueKey, color: guessSensorColor(sensor) });

  let showNeighbors = false;
  let open = false;
</script>

<style>
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

  .popup-container {
    padding: 0;
  }

  .popup {
    border: 1px solid #232735;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    background: #232735;
    color: white;
  }
  .popup-body {
    border-radius: 4px 4px;
    margin: 2px;
    padding: 1em;
    background: white;
    color: #666;
  }
  .popup-header {
    padding: 13px;
    font-weight: 700;
    display: flex;
  }
  .popup-title {
    flex-grow: 1;
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

<tr>
  {#if !open}
    <td>
      <a href="#{sensor.key}" class="uk-link-text" on:click|preventDefault={() => (open = true)}>
        <span class="inline-svg-icon">
          {@html plusCircleIcon}
        </span>
        {sensor.name}
      </a>
    </td>
    <td class="uk-text-right">TODO</td>
    <td class="uk-text-right">
      {#await currentRow}?{:then row}{row ? sensor.formatValue(row[valueKey]) : 'N/A'}{/await}
    </td>
    <td>
      <Vega {spec} {data} tooltip={SparkLineTooltip} tooltipProps={{ sensor }} signals={{ currentDate: params.date }} />
    </td>
  {:else}
    <td colspan="4" class="popup-container">
      <div class="popup">
        <header class="popup-header">
          <span class="inline-svg-icon" style="color: {guessSensorColor(sensor)}">
            {@html circleIcon}
          </span>
          <span class="popup-title">{sensor.name}</span>
          <button class="popup-button" on:click={() => (open = false)}>
            <span class="inline-svg-icon">
              {@html eyeHideIcon}
            </span>
            Hide
          </button>
        </header>
        <div class="popup-body">
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
    </td>
  {/if}
</tr>
