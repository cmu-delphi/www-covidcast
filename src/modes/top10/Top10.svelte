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
  import { addMissing, fetchRegionSlice, fetchTimeSlice } from '../../data/fetchData';
  import { modeByID } from '..';
  import { getInfoByName, nameInfos } from '../../maps';
  import Top10Sensor from './Top10Sensor.svelte';
  import Search from '../../components/Search.svelte';
  import Top10SortHint from './Top10SortHint.svelte';
  import { levelMegaCounty, groupedSensorList, sensorList, primaryValue, yesterdayDate } from '../../stores/constants';
  import { highlightTimeValue } from '../../stores';
  import { parseAPITime } from '../../data';
  import { onHighlight } from '../overview/vegaSpec';
  import { computeNeighborhood } from '../../util';
  import InfoDialogButton from '../../components/InfoDialogButton.svelte';

  const SHOW_X_MORE = 10;
  const MAX_OTHER_SENSORS = 1;
  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200401');
  const finalDay = yesterdayDate;

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
    const info = getInfoByName(row.geo_value, row.geo_type);
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
   * @type {import('../../stores/constants').CasesOrDeathOptions}
   */
  const ratioOptions = {
    cumulative: false,
    incidence: false,
  };
  $: primaryField = primaryValue(primary, ratioOptions);
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
        if (a.primary[primaryField] !== b.primary[primaryField]) {
          return a.primary[primaryField] < b.primary[primaryField] ? -1 : 1;
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

  const primaryDataCache = new Map();
  $: {
    if (primary != null) {
      // clear cache once the primary changes
      primaryDataCache.clear();
    }
  }
  $: primaryData = sortedRows.map((row) => {
    const key = `${row.propertyId}-${primary.key}`;
    if (primaryDataCache.has(key)) {
      return primaryDataCache.get(key);
    }
    const data = fetchTimeSlice(primary, row.level, row.propertyId, startDay, finalDay, true, {
      geo_value: row.propertyId,
    }).then((r) => addMissing(r));
    primaryDataCache.set(key, data);
    return data;
  });

  $: neighborhood = computeNeighborhood($currentDateObject, startDay, finalDay, (finalDay - startDay) / 2);

  // Returns the max value for all rows of all locations.
  // rowsOfRows is an array for all locations of the rows for each location.
  function maxNested(rowsOfRows, field) {
    if (rowsOfRows.length === 0) {
      return 0;
    }
    field = field === 'pValue' ? 'value' : field;

    // Filter rows to only include the neighborhood.
    const filterInNeighborhood = (rows) =>
      rows.filter((row) => row.date_value >= neighborhood.start && row.date_value <= neighborhood.end);
    return rowsOfRows
      .map(filterInNeighborhood)
      .flat()
      .reduce((acc, v) => Math.max(acc, v[field] != null ? v[field] : 0), 0);
  }

  // compute local maxima
  $: primaryDomain = Promise.all(primaryData).then((rows) => [0, maxNested(rows, primaryField)]);

  $: otherDataAndDomain = otherSensors.map((sensor) => {
    const data = sortedRows.map((row) =>
      fetchTimeSlice(sensor, row.level, row.propertyId, startDay, finalDay, true, {
        geo_value: row.propertyId,
      }).then((r) => addMissing(r)),
    );
    const field = primaryValue(sensor, ratioOptions);
    const domain = Promise.all(data).then((rows) => [0, maxNested(rows, field)]);
    return { data, domain };
  });

  function jumpTo(row) {
    currentMode.set(modeByID.classic);
    selectByInfo(row);
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
</script>

<div class="root">
  <Options className="options-container" />
  <div class="search-container container-bg container-style">
    <Search
      placeholder="Search for a location..."
      items={nameInfos}
      selectedItem={$currentRegionInfo}
      labelFieldName="displayName"
      maxItemsToShowInList="5"
      on:change={(e) => selectByInfo(e.detail)}
    />
  </div>

  <div class="wrapper" class:loading>
    <div>
      <table class="table uk-table uk-table-responsive uk-table-divider">
        <thead>
          <tr>
            <th class="uk-table-shrink">#</th>
            <th class="uk-width-1-3">
              <Top10SortHint
                label="Name"
                on:click={() => sortClick('name')}
                sorted={sortCriteria === 'name'}
                desc={sortDirectionDesc}
              >
                Name
              </Top10SortHint>
            </th>
            <th class="uk-table-shrink table-pop-column">
              <Top10SortHint
                label="Population"
                on:click={() => sortClick('population')}
                sorted={sortCriteria === 'population'}
                desc={sortDirectionDesc}
              >
                Pop.
              </Top10SortHint>
            </th>
            <th class="uk-width-1-3" colspan={primary.isCasesOrDeath ? 3 : 2}>
              <Top10SortHint
                label={primary.name}
                on:click={() => sortClick('primary', true)}
                sorted={sortCriteria === 'primary'}
                desc={sortDirectionDesc}
              >
                {primary.plotTitleText}
                <InfoDialogButton sensor={primary} className="info" />
              </Top10SortHint>
            </th>
            {#each otherSensors as s, i}
              <th class="uk-width-1-3" colspan={s.isCasesOrDeath ? 3 : 2}>
                <Top10SortHint
                  label={s.name}
                  on:click={() => sortClick(i, true)}
                  sorted={sortCriteria === i}
                  desc={sortDirectionDesc}
                >
                  {primary.plotTitleText}
                  <InfoDialogButton sensor={s} className="info" />
                  <button
                    class="remove-column"
                    title="Remove column"
                    on:click={() => (otherSensors = otherSensors.filter((d) => d !== s))}
                    data-uk-icon="icon: close"
                  />
                </Top10SortHint>
              </th>
            {/each}
            {#if otherSensors.length < MAX_OTHER_SENSORS}
              <th class="uk-table-shrink add-column-container" rowspan="2">
                <div uk-form-custom="target: true">
                  <select bind:value={chosenColumn}>
                    {#each groupedSensorList as sensorGroup}
                      <optgroup label={sensorGroup.label}>
                        {#each sensorGroup.sensors as sensor}
                          <option
                            disabled={sensor.key === primary.key || otherSensors.includes(sensor)}
                            title={typeof sensor.tooltipText === 'function' ? sensor.tooltipText() : sensor.tooltipText}
                            value={sensor.key}
                          >
                            {sensor.name}
                          </option>
                        {/each}
                      </optgroup>
                    {/each}
                  </select>
                  <button type="button" aria-label="add column options" data-uk-icon="icon: plus" />
                </div>
              </th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each sortedRows as row, i}
            <tr class:uk-active={row.propertyId === $currentRegion}>
              <td>{row.rank}.</td>
              <td>
                <a href="?region={row.propertyId}" on:click|preventDefault={jumpTo(row)} title="Show on Map">
                  {row.displayName}
                </a>
              </td>
              <td class="table-pop-column" title="Population">
                {row.population != null ? row.population.toLocaleString() : 'Unknown'}
              </td>
              <Top10Sensor
                sensor={primary}
                single={row.primary}
                data={primaryData[i]}
                domain={primaryDomain}
                {row}
                highlightTimeValue={$highlightTimeValue}
                {ratioOptions}
                {onHighlight}
              />
              {#each otherSensors as s, si}
                <Top10Sensor
                  sensor={s}
                  single={row.others[si]}
                  data={otherDataAndDomain[si].data[i]}
                  domain={otherDataAndDomain[si].domain}
                  {row}
                  highlightTimeValue={$highlightTimeValue}
                  {ratioOptions}
                  {onHighlight}
                />
              {/each}
            </tr>
          {/each}
        </tbody>
        {#if showTopN < rows.length}
          <tfoot>
            <tr>
              <td colspan="100" class="button-bar">
                {rows.length - sortedRows.length}
                {rows.length - sortedRows.length > 1 ? 'locations' : 'location'}
                hidden
                <button on:click={showMore} class="uk-button uk-button-default uk-button-small"
                  >Show
                  {SHOW_X_MORE}
                  more locations</button
                >
              </td>
            </tr>
          </tfoot>
        {/if}
      </table>
    </div>
  </div>
</div>

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

  .wrapper {
    position: relative;
    grid-area: table;
  }

  .wrapper > div {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .table {
    width: unset;
  }

  .root > :global(.options-container) {
    grid-area: options;
    z-index: 1010;
    margin: 0 6px;
  }

  .search-container {
    grid-area: search;
    z-index: 1009;
    margin: 0 6px;
  }

  @media only screen and (max-width: 767px) {
    .add-column-container,
    .table-pop-column {
      display: none;
    }
  }

  .button-bar {
    text-align: center;
    border: none;
  }

  .button-bar > button {
    width: unset;
    display: inline-block;
  }

  .remove-column {
    position: absolute;
    right: 0.2em;
    top: 0.2em;
  }

  .wrapper :global(.info) {
    margin-left: 0.5em;
    display: inline-block;
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
  }
</style>
