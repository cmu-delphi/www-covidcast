<script>
  import Options from '../../components/Options.svelte';
  import {
    currentData,
    currentLevel,
    currentSensorEntry,
    currentMode,
    currentRegion,
    currentRegionName,
    currentDateObject,
  } from '../../stores';
  import hotspotsLineChart from './HotspotsLineChart.json';
  import { fetchTimeSlice } from '../../data/fetchData';
  import IoIosPin from 'svelte-icons/io/IoIosPin.svelte';
  import modes from '..';
  import { regionSearchLookup } from '../../stores/search';
  import Vega from '../../components/vega/Vega.svelte';
  import { formatAPITime } from '../../data';

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
      value: row.count != null ? row.count : row.value,
      level,
      geo_value: row.geo_value,
    };
  }

  function byDate(a, b) {
    if (a.date_value < b.date_value) {
      return -1;
    }
    if (a.date_value > b.date_value) {
      return 1;
    }
    return 0;
  }

  const TOP_HOTSPOTS = 10;

  function byHotspot(a, b) {
    // TODO better ranking
    if (a.value !== b.value) {
      return a.value < b.value ? 1 : -1;
    }
    return a.geo_value.localeCompare(b.geo_value);
  }

  function unifyStartEnd(promises) {
    // compute the unified data (same min,max)
    return Promise.all(promises).then((allData) => {
      // ensure common min / max date
      const minDate = allData.reduce(
        (acc, d) => (d.length === 0 ? acc : Math.min(acc, d[0].date_value.getTime())),
        Number.POSITIVE_INFINITY,
      );
      const maxDate = allData.reduce(
        (acc, d) => (d.length === 0 ? acc : Math.max(acc, d[d.length - 1].date_value.getTime())),
        Number.NEGATIVE_INFINITY,
      );
      if (!Number.isFinite(minDate) || !Number.isFinite(maxDate)) {
        return allData;
      }
      const min = new Date(minDate);
      const max = new Date(maxDate);
      return allData.map((rows) => {
        if (rows.length === 0) {
          return rows;
        }
        const first = rows[0].date_value;
        if (first > min) {
          // create a fake min one
          rows.unshift({
            ...rows[0],
            time_value: Number.parseInt(formatAPITime(min), 10),
            date_value: min,
            value: null,
          });
        }
        const last = rows[rows.length - 1].date_value;
        if (last < max) {
          // create a fake max one
          rows.push({
            ...rows[rows.length - 1],
            time_value: Number.parseInt(formatAPITime(max), 10),
            date_value: max,
            value: null,
          });
        }
        return rows;
      });
    });
  }

  // transform current data
  $: rawData = $currentData
    .map((row) => toHotspotData(row, $regionSearchLookup, $currentLevel))
    .sort(byHotspot)
    .slice(0, TOP_HOTSPOTS);

  $: data = (() => {
    // fetch all data
    const promises = rawData.map((row) =>
      fetchTimeSlice($currentSensorEntry, row.level, row.geo_value).then((d) => d.sort(byDate)),
    );
    const all = unifyStartEnd(promises);
    // inject data
    return rawData.map((d, i) => {
      d.data = all.then((arr) => arr[i]);
      return d;
    });
  })();

  function jumpTo(row) {
    currentMode.set(modes.find((d) => d.id === 'overview'));
    currentRegion.set(row.id);
    currentRegionName.set(row.name);
  }
</script>

<style>
  .root {
    flex: 1 1 0;
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

<div class="root content">
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
          <th>{$currentDateObject.toLocaleDateString()}</th>
          <th>Time Series</th>
        </tr>
      </thead>
      <tbody>
        {#each data as row}
          <tr>
            <td>
              <div class="name">
                <span>{row.name}</span>
                <button class="pg-button" title="Show on Map" on:click={jumpTo(row)}>
                  <IoIosPin />
                </button>
              </div>
            </td>
            <td class="right">{row.value != null ? row.value.toFixed(3) : 'Unknown'}</td>
            <td class="chart">
              <Vega data={row.data} spec={hotspotsLineChart} signals={{ currentDate: $currentDateObject }} />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
