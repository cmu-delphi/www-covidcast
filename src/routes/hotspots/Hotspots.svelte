<script>
  import Options from '../../components/Options.svelte';
  import { currentData, geojsons, currentLevel, currentSensorEntry, currentDate } from '../../stores';
  import LineChart from '../../components/vega/LineChart.svelte';
  import { fetchTimeSlice } from '../../data/fetchData';

  /**
   * @param {import('../../data/fetchData').EpiDataRow} row
   * @param {Map<string, any>} properties
   */
  function toHotspotData(row, properties, level) {
    const props = properties.get(row.geo_value.toUpperCase());
    return {
      name: props ? props.NAME : row.geo_value,
      population: props ? Number.parseInt(props.population, 10) : 'Unknown',
      value: row.value,
      level: level,
      geo_value: row.geo_value,
    };
  }

  function addData(row, sensor) {
    row.data = fetchTimeSlice(sensor, row.level, row.geo_value);
    return row;
  }

  function byHotspot(a, b) {
    if (a.value !== b.value) {
      return a.value < b.value ? 1 : -1;
    }
    return a.geo_value.localeCompare(b.geo_value);
  }

  $: properties = !$geojsons.has($currentLevel)
    ? new Map()
    : new Map($geojsons.get($currentLevel).features.map((r) => [r.properties.id, r.properties]));
  $: data = $currentData
    .map((row) => toHotspotData(row, properties, $currentLevel))
    .sort(byHotspot)
    .slice(0, 10)
    .map((d) => addData(d, $currentSensorEntry));
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
            <td>{row.name}</td>
            <td class="right">{row.value.toFixed(3)}</td>
            <td class="chart">
              <LineChart data={row.data} />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
