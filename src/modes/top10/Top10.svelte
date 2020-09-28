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
  import IoMdRemove from 'svelte-icons/io/IoMdRemove.svelte';
  import IoIosPin from 'svelte-icons/io/IoIosPin.svelte';
  import { modeByID } from '..';
  import { getInfoByName, nameInfos } from '../../maps';
  import Top10Sensor from './Top10Sensor.svelte';
  import Search from '../../components/Search.svelte';
  import { throttle } from 'lodash-es';
  import Top10SortHint from './Top10SortHint.svelte';
  import { levelMegaCounty, groupedSensorList, sensorList } from '../../stores/constants';

  const SHOW_X_MORE = 10;
  const MAX_OTHER_SENSORS = 1;
  /**
   * @typedef {import('../../maps').NameInfo} ValueRow
   * @property {import('../../data/fetchData').EpiDataRow} primary
   * @property {import('../../data/fetchData').EpiDataRow[]} others
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
      others: [],
    };
  }

  $: primary = $currentSensorEntry;
  let showTopN = 10;
  let sortCriteria = 'primary';
  let sortDirectionDesc = true;
  /**
   * @type {import('../../stores/constants').SensorEntry[]}
   */
  let otherSensors = [];

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
    if (typeof sortCriteria === 'number') {
      // others
      return (a, b) => {
        const oa = a.others[sortCriteria];
        const ob = b.others[sortCriteria];
        const va = oa ? oa.value : null;
        const vb = ob ? ob.value : null;
        if (va !== vb) {
          return va < vb ? -1 : 1;
        }
        return a.displayName.localeCompare(b.displayName);
      };
    }

    return (a, b) => {
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
    const toLoad = [primary, ...otherSensors];
    Promise.all(
      toLoad.map((d) =>
        fetchRegionSlice(d, $currentLevel, $currentDateObject, {
          stderr: null,
        }),
      ),
    ).then((sensorData) => {
      const data = sensorData[0];
      const converted = data.map((row) => extentData(row)).filter((d) => d != null && d.level !== levelMegaCounty.id);
      loading = false;
      if (sensorData.length === 1) {
        rows = converted;
        return;
      }
      // inject other data
      const rowById = new Map(converted.map((d) => [d.primary.geo_value, d]));
      sensorData.slice(1).forEach((other, i) => {
        for (const row of other) {
          const r = rowById.get(row.geo_value);
          if (!r) {
            continue;
          }
          r.others[i] = row;
        }
      });
      rows = converted;
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

  function jumpTo(row) {
    currentMode.set(modeByID.overview);
    currentRegion.set(row.id);
  }

  function showMore() {
    showTopN = Math.min(rows.length, showTopN + SHOW_X_MORE);
  }

  function sortClick(prop, defaultSortDesc = false) {
    if (sortCriteria === prop) {
      sortDirectionDesc = !sortDirectionDesc;
      return;
    }
    sortCriteria = prop;
    sortDirectionDesc = defaultSortDesc;
  }

  let chosenColumn = '';

  $: {
    if (chosenColumn) {
      otherSensors = otherSensors.concat([sensorList.find((d) => d.key === chosenColumn)]);
      chosenColumn = '';
    }
  }

  let highlightTimeValue = null;

  const throttled = throttle((value) => {
    highlightTimeValue = value;
  }, 10);

  function onHighlight(e) {
    const highlighted = e.detail.value;
    const id = highlighted && Array.isArray(highlighted._vgsid_) ? highlighted._vgsid_[0] : null;

    if (!id) {
      throttled(null);
      return;
    }
    const row = e.detail.view.data('data_0').find((d) => d._vgsid_ === id);
    throttled(row ? row.time_value : null);
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
    /* gap: 6px; */
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
    vertical-align: top;
    padding-top: 1em;
  }

  td,
  th {
    border: 0;
  }

  .table > table {
    border-collapse: collapse;
    width: 100%;
    overflow: unset;
  }

  table {
    padding: 1em;
    font-size: 1.2em;
  }

  .go-to-map-pin {
    width: 16px;
    display: inline-block;
    cursor: pointer;
  }
  .go-to-map-pin:hover {
    color: black;
  }

  @media only screen and (max-width: 767px) {
    table {
      padding: 4px;
      font-size: 1em;
    }

    .table-pop-column {
      display: none;
    }

    .add-column-container {
      display: none;
    }

    .go-to-map-pin {
      display: none;
    }
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
    font-weight: bold;
  }

  .add-column {
    max-width: 9em;
    border-radius: 3px;
    padding: 0;
    margin: 0;
    display: inline-block;
  }

  .remove-column {
    position: absolute;
    right: 0.2em;
    top: 0.2em;
    font-size: 0.7rem;
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

  <div class="table base-font-size" class:loading>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>
            <Top10SortHint
              label="Name"
              on:click={() => sortClick('name')}
              sorted={sortCriteria === 'name'}
              desc={sortDirectionDesc}>
              Name
            </Top10SortHint>
          </th>
          <th class="table-pop-column">
            <Top10SortHint
              label="Population"
              on:click={() => sortClick('population')}
              sorted={sortCriteria === 'population'}
              desc={sortDirectionDesc}>
              Pop.
            </Top10SortHint>
          </th>
          <th colspan={primary.isCasesOrDeath ? 3 : 2}>
            <Top10SortHint
              label={primary.name}
              on:click={() => sortClick('primary', true)}
              sorted={sortCriteria === 'primary'}
              desc={sortDirectionDesc}>
              {typeof primary.mapTitleText === 'function' ? primary.mapTitleText() : primary.name}
            </Top10SortHint>
          </th>
          {#each otherSensors as s, i}
            <th colspan={s.isCasesOrDeath ? 3 : 2}>
              <Top10SortHint
                label={s.name}
                on:click={() => sortClick(i, true)}
                sorted={sortCriteria === i}
                desc={sortDirectionDesc}>
                {typeof s.mapTitleText === 'function' ? s.mapTitleText() : s.name}
                <button
                  class="pg-button remove-column"
                  title="Remove column"
                  on:click={() => (otherSensors = otherSensors.filter((d) => d !== s))}>
                  <IoMdRemove />
                </button>
              </Top10SortHint>
            </th>
          {/each}
          {#if otherSensors.length < MAX_OTHER_SENSORS}
            <th class="add-column-container" rowspan="2">
              <select aria-label="add column options" bind:value={chosenColumn} class="add-column">
                <option value="">Add indicator</option>
                {#each groupedSensorList as sensorGroup}
                  <optgroup label={sensorGroup.label}>
                    {#each sensorGroup.sensors as sensor}
                      <option
                        disabled={sensor.key === primary.key || otherSensors.includes(sensor)}
                        title={typeof sensor.tooltipText === 'function' ? sensor.tooltipText() : sensor.tooltipText}
                        value={sensor.key}>
                        {sensor.name}
                      </option>
                    {/each}
                  </optgroup>
                {/each}
              </select>
            </th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each sortedRows as row}
          <tr class:selected={row.propertyId === $currentRegion}>
            <td>{row.rank}.</td>
            <td>
              {row.displayName}
              <span class="go-to-map-pin" on:click={jumpTo(row)} title="Show on Map">
                <IoIosPin />
              </span>
            </td>
            <td class="right table-pop-column" title="Population">
              {row.population != null ? row.population.toLocaleString() : 'Unknown'}
            </td>
            <Top10Sensor
              sensor={primary}
              single={row.primary}
              {row}
              level={row.level}
              {highlightTimeValue}
              {onHighlight} />
            {#each otherSensors as s, si}
              <Top10Sensor
                sensor={s}
                single={row.others[si]}
                {row}
                level={row.level}
                {highlightTimeValue}
                {onHighlight} />
            {/each}
          </tr>
        {/each}
      </tbody>
      {#if showTopN < rows.length}
        <tfoot>
          <tr>
            <td
              colspan={3 + (primary.isCasesOrDeath ? 3 : 2) + otherSensors.reduce((acc, s) => (acc + s.isCasesOrDeath ? 3 : 2), 0)}
              class="button-bar">
              {rows.length - sortedRows.length}
              {rows.length - sortedRows.length > 1 ? 'locations' : 'location'} hidden <button
                on:click={showMore}
                class="pg-button">Show {SHOW_X_MORE} more locations</button>
            </td>
          </tr>
        </tfoot>
      {/if}
    </table>
  </div>
</div>
