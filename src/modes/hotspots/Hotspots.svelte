<script>
  import Options from '../../components/Options.svelte';
  import { currentLevel, currentSensorEntry, currentMode, currentRegion, currentDateObject } from '../../stores';
  import hotspotsLineChart from './HotspotsLineChart.json';
  import { fetchRegionSlice, fetchMultipleRegionsTimeSlices } from '../../data/fetchData';
  import IoIosPin from 'svelte-icons/io/IoIosPin.svelte';
  import modes from '..';
  import { regionSearchLookup } from '../../stores/search';
  import Vega from '../../components/vega/Vega.svelte';

  /**
   * @param {import('../../data/fetchData').EpiDataRow} row
   * @param {Map<string, import('../../maps').NameInfo>} lookup
   * @param {string} level   */
  function toHotspotData(row, lookup, level) {
    // TODO generalize this process into the stores
    const props = lookup(row.geo_value.toUpperCase());
    return {
      id: row.geo_value.toUpperCase(),
      name: props ? props.displayName : row.geo_value,
      value: row.count != null ? row.count : row.value,
      avg: row.avg,
      level,
      geo_value: row.geo_value,
    };
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
  let loading = true;
  let rawData = [];
  $: {
    loading = true;
    fetchRegionSlice($currentSensorEntry, $currentLevel, $currentDateObject).then((rows) => {
      rawData = rows
        .map((row) => toHotspotData(row, $regionSearchLookup, $currentLevel))
        .sort(byHotspot)
        .slice(0, TOP_HOTSPOTS);
      loading = false;
    });
  }

  $: data = fetchMultipleRegionsTimeSlices(
    $currentSensorEntry,
    $currentLevel,
    rawData.map((d) => d.geo_value),
  ).map((d, i) => ({ ...rawData[i], data: d }));

  function jumpTo(row) {
    currentMode.set(modes.find((d) => d.id === 'overview'));
    currentRegion.set(row.id);
  }

  $: isCasesOrDeath = $currentSensorEntry.isCasesOrDeath;
</script>

<style>
  .root {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    padding: 0 2%;
  }

  .table {
    flex: 1 1 0;
    overflow: auto;
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

  .name button {
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .name:hover button {
    opacity: 1;
  }

  .right {
    text-align: right;
  }

  .table th {
    background: white;
    text-align: center;
  }

  .table > table {
    border-collapse: collapse;
    width: 100%;
    overflow: unset;
  }

  .chart {
    width: 20em;
    height: 4em;
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
</style>

<div class="root">
  <Options className="options-container" />
  <div class="table base-font-size">
    <table>
      <thead>
        <tr>
          <th rowspan="2">#</th>
          <th rowspan="2">Name</th>
          <th colspan={isCasesOrDeath ? 3 : 2}>{$currentSensorEntry.name}</th>
        </tr>
        <tr>
          <th>{$currentDateObject.toLocaleDateString()}</th>
          {#if isCasesOrDeath}
            <th>7-day Average</th>
          {/if}
          <th>Time Series</th>
        </tr>
      </thead>
      <tbody>
        {#each data as row, i}
          <tr>
            <td>{i + 1}.</td>
            <td>
              <div class="name">
                <span>{row.name}</span>
                <button class="pg-button" title="Show on Map" on:click={jumpTo(row)}>
                  <IoIosPin />
                </button>
              </div>
            </td>
            <td class="right">{row.value != null ? $currentSensorEntry.formatValue(row.value) : 'Unknown'}</td>
            {#if isCasesOrDeath}
              <td class="right">{row.avg != null ? $currentSensorEntry.formatValue(row.avg) : 'Unknown'}</td>
            {/if}
            <td class="chart">
              <Vega data={row.data} spec={hotspotsLineChart} signals={{ currentDate: $currentDateObject }} />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
