<script>
  import Options from '../../components/Options.svelte';
  import {
    currentLevel,
    currentSensorEntry,
    currentMode,
    currentRegion,
    currentDateObject,
    currentRegionInfo,
    selectByInfo,
  } from '../../stores';
  import { fetchRegionSlice } from '../../data/fetchData';
  import IoIosPin from 'svelte-icons/io/IoIosPin.svelte';
  import modes from '..';
  import { getInfoByName, nameInfos } from '../../maps';
  import Top10Sensor from './Top10Sensor.svelte';
  import Search from '../../components/Search.svelte';
  import { levelMegaCounty } from '../../stores/constants';

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
  let sortDirectionDesc = true;

  function applyDirection(comparator, sortDirectionDesc) {
    return sortDirectionDesc ? (a, b) => -comparator(a, b) : comparator;
  }
  function bySortCriteria(sortCriteria) {
    if (sortCriteria === 'primary') {
      return (a, b) => {
        if (a.primary.value !== b.primary.value) {
          return a.primary.value < b.primary.value ? -1 : 1;
        }
        return a.displayName.localeCompare(b.displayName);
      };
    }
    if (sortCriteria === 'population') {
      return (a, b) => {
        if (a.population !== b.population) {
          return a.population < b.population ? -1 : 1;
        }
        return a.displayName.localeCompare(b.displayName);
      };
    }
    return (a, b) => {
      if (a.population !== b.population) {
        return a.population < b.population ? -1 : 1;
      }
      return a.displayName.localeCompare(b.displayName);
    };
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
      rows = data.map((row) => extentData(row)).filter((d) => d != null && d.level !== levelMegaCounty.id);
      loading = false;
    });
  }

  $: comparator = applyDirection(bySortCriteria(sortCriteria), sortDirectionDesc);
  $: sortedRows = rows
    .slice()
    .sort(comparator)
    .map((d, i) => {
      d.rank = i + 1;
      return d;
    })
    .filter((d, i) => i < showTopN || d.propertyId === $currentRegion);

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

  function sortClick(prop, defaultSortDesc = false) {
    if (sortCriteria === prop) {
      sortDirectionDesc = !sortDirectionDesc;
      return;
    }
    sortCriteria = prop;
    sortDirectionDesc = defaultSortDesc;
  }
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    display: grid;
    grid-template-columns: 1fr min(25%, 30em);
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'options search'
      'table table';
    gap: 6px;
  }

  .root > :global(.options-container) {
    grid-area: options;
    z-index: 1010;
  }

  .root > :global(.search-container) {
    grid-area: search;
    z-index: 1009;
    margin: 0 6px 6px 0;
  }

  .table {
    grid-area: table;
    margin: 0 6px;
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
    cursor: pointer;
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
    border: none;
  }

  .button-bar > button {
    width: unset;
    display: inline-block;
  }

  .selected > :global(td) {
    border: 2px solid var(--red);
  }

  .sorted::after {
    content: '▲';
    display: inline-block;
  }

  .desc .sorted::after {
    content: '▼';
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    .root {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto 1fr;
      grid-template-areas:
        'options'
        'search'
        'table';
    }
    .root > :global(.search-container) {
      margin: 0 0 0 6px;
    }
  }
</style>

<div class="root">
  <Options className="options-container" />
  <Search
    className="search-container container-bg container-style"
    placeholder="Search for a location..."
    items={nameInfos}
    selectedItem={$currentRegionInfo}
    labelFieldName="displayName"
    maxItemsToShowInList="5"
    on:change={(e) => selectByInfo(e.detail)} />

  <div class="table base-font-size">
    <table>
      <thead class:desc={sortDirectionDesc}>
        <tr>
          <th rowspan="2">#</th>
          <th rowspan="2" class:sorted={sortCriteria === 'name'} on:click={() => sortClick('name')}>Name</th>
          <th rowspan="2" class:sorted={sortCriteria === 'population'} on:click={() => sortClick('population', true)}>
            Population
          </th>
          <th
            colspan={primary.isCasesOrDeath ? 3 : 2}
            class:sorted={sortCriteria === 'primary'}
            on:click={() => sortClick('primary', true)}>
            {primary.name}
          </th>
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
          <tr class:selected={row.propertyId === $currentRegion}>
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
