<script>
  import Options from '../../components/Options.svelte';
  import { currentLevel, currentSensorEntry, currentMode, currentRegion, currentDateObject } from '../../stores';
  import { fetchRegionSlice } from '../../data/fetchData';
  import IoIosPin from 'svelte-icons/io/IoIosPin.svelte';
  import modes from '..';
  import { getInfoByName } from '../../maps';
  import Top10Sensor from './Top10Sensor.svelte';

  /**
   * @typedef {import('../../maps').NameInfo} ValueRow
   * @property {import('../../data/fetchData').EpiDataRow} primary
   * @property {number} rank
   */
  /**
   * @param {import('../../data/fetchData').EpiDataRow} row
   */
  function extentData(row) {
    const info = getInfoByName(row.geo_value);
    if (!info) {
      return null;
    }
    return {
      ...info,
      primary: row,
    };
  }

  $: primary = $currentSensorEntry;
  let showTopN = 10;
  let sortCriteria = 'primary';

  function bySortCriteria(a, b, _sortCriteria) {
    // TODO better ranking
    if (a.primary.value !== b.primary.value) {
      return a.primary.value < b.primary.value ? 1 : -1;
    }
    return a.displayName.localeCompare(b.displayName);
  }

  // transform current data
  let loading = true;

  /**
   * @type {ValueRow[]}
   */
  let rows = [];
  $: {
    loading = true;
    fetchRegionSlice(primary, $currentLevel, $currentDateObject).then((data) => {
      rows = data.map((row) => extentData(row)).filter(Boolean);
      loading = false;
    });
  }

  $: sortedRows = rows
    .slice()
    .sort((a, b) => bySortCriteria(a, b, sortCriteria))
    .map((d, i) => {
      d.rank = i + 1;
      return d;
    })
    .slice(0, showTopN);

  // /**
  //  * @type {import('../../stores/constants').SensorEntry[]}
  //  */
  // let otherSensors = [];

  function jumpTo(row) {
    currentMode.set(modes.find((d) => d.id === 'overview'));
    currentRegion.set(row.id);
  }

  function showMore() {
    showTopN = Math.min(rows.length, showTopN + 10);
  }
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

  .table :global(td) {
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

  .table th {
    background: white;
    text-align: center;
  }

  .table > table {
    border-collapse: collapse;
    width: 100%;
    overflow: unset;
  }

  .right {
    text-align: right;
  }

  .button-bar {
    text-align: center;
  }

  .button-bar > button {
    width: unset;
    display: inline-block;
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
          <th rowspan="2">Population</th>
          <th colspan={primary.isCasesOrDeath ? 3 : 2}>{primary.name}</th>
        </tr>
        <tr>
          <th>{$currentDateObject.toLocaleDateString()}</th>
          {#if primary.isCasesOrDeath}
            <th>7-day Average</th>
          {/if}
          <th>Time Series</th>
        </tr>
      </thead>
      <tbody>
        {#each sortedRows as row, i}
          <tr>
            <td>{row.rank}.</td>
            <td>
              <div class="name">
                <span>{row.displayName}</span>
                <button class="pg-button" title="Show on Map" on:click={jumpTo(row)}>
                  <IoIosPin />
                </button>
              </div>
            </td>
            <td class="right">{row.population != null ? row.population.toLocaleString() : 'Unknown'}</td>
            <Top10Sensor sensor={primary} single={row.primary} id={row.propertyId} level={row.level} />
          </tr>
        {/each}
      </tbody>
      {#if showTopN < rows.length}
        <tfoot>
          <tr>
            <td colspan={3 + (primary.isCasesOrDeath ? 3 : 2)} class="button-bar">
              <button on:click={showMore} class="pg-button">Show More</button>
            </td>
          </tr>
        </tfoot>
      {/if}
    </table>
  </div>
</div>
