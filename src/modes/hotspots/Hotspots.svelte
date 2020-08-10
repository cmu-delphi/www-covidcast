<script>
  import Options from '../../components/Options.svelte';
  import {
    currentData,
    currentLevel,
    currentSensorEntry,
    currentDate,
    currentMode,
    currentRegion,
    currentRegionName,
  } from '../../stores';
  import LineChart from '../../components/vega/LineChart.svelte';
  import { fetchTimeSlice } from '../../data/fetchData';
  import IoIosPin from 'svelte-icons/io/IoIosPin.svelte';
  import modes from '..';
  import { regionSearchLookup } from '../../stores/search';

  /**
   * @param {import('../../data/fetchData').EpiDataRow} row
   * @param {Map<string, import('../../maps/nameIdInfo').NameInfo>} lookup
   * @param {string} level   */
  function toHotspotData(row, lookup, level) {
    // TODO generalize this process into the stores
    const props = lookup(row.geo_value.toUpperCase());
    return {
      id: row.geo_value.toUpperCase(),
      name: props ? props.display_name : row.geo_value,
      value: row.value,
      level,
      geo_value: row.geo_value,
    };
  }

  function addData(row, sensor) {
    row.data = fetchTimeSlice(sensor, row.level, row.geo_value);
    return row;
  }

  const TOP_HOTSPOTS = 10;

  function byHotspot(a, b) {
    // TODO better ranking
    if (a.value !== b.value) {
      return a.value < b.value ? 1 : -1;
    }
    return a.geo_value.localeCompare(b.geo_value);
  }

  // transform current data
  $: data = $currentData
    .map((row) => toHotspotData(row, $regionSearchLookup, $currentLevel))
    .sort(byHotspot)
    .slice(0, TOP_HOTSPOTS)
    .map((d) => addData(d, $currentSensorEntry));

  function jumpTo(row) {
    currentMode.set(modes.find((d) => d.id === 'overview'));
    currentRegion.set(row.id);
    currentRegionName.set(row.name);
  }
</script>

<style>
  .root {
    flex: 1 1 0;
    padding: 0 2%;
    display: flex;
    flex-direction: column;
  }
  .options-container {
    margin-bottom: 0.1em;
  }

  .table {
    flex: 1 1 0;
    overflow: auto;
    position: relative;
  }

  .table td {
    vertical-align: middle;
  }

  .name {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .name > span {
    margin-right: 0.5em;
  }

  .right {
    text-align: right;
  }

  .table th {
    background: white;
    position: sticky;
    text-align: center;
    top: 0;
  }

  .table > table {
    border-collapse: collapse;
    width: 100%;
    overflow: unset;
  }

  .chart {
    width: 10em;
    height: 3em;
    position: relative;
    padding: 0;
    box-sizing: border-box;
  }
  .chart > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }
  /** mobile **/
  @media only screen and (max-width: 767px) {
    .root {
      padding: 0.1em;
    }
  }
</style>

<div class="root">
  <h2>Hotspots</h2>
  <div class="options-container container-bg base-font-size container-style">
    <Options />
  </div>
  <div class="table base-font-size">
    <table>
      <thead>
        <tr>
          <th rowspan="2">Name</th>
          <th colspan="2">{$currentSensorEntry.name}</th>
        </tr>
        <tr>
          <th>{$currentDate}</th>
          <th>Time Series</th>
        </tr>
      </thead>
      <tbody>
        {#each data as row}
          <tr>
            <td class="name">
              <span>{row.name}</span>
              <button class="pg-button" title="Show on Map" on:click={jumpTo(row)}>
                <IoIosPin />
              </button>
            </td>
            <td class="right">{row.value != null ? row.value.toFixed(3) : 'Unknown'}</td>
            <td class="chart">
              <LineChart data={row.data} />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
