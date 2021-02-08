<script>
  import { getCountiesOfState, getInfoByName, stateInfo } from '../../maps';
  import { fetchData } from '../../data/fetchData';
  import Top10SortHint from '../top10/Top10SortHint.svelte';

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @param {import('../../maps').NameInfo} region
   */
  function determineRegions(region) {
    if (region.level === 'state') {
      return getCountiesOfState(region);
    }
    if (region.level === 'county') {
      const state = getInfoByName(region.state);
      return getCountiesOfState(state);
    }
    return stateInfo;
  }

  /**
   * @param {import('../../stores/constants').SensorEntry} sensor
   * @param {import("../utils").Params} params
   */
  function loadData(sensor, params) {
    if (params.region.level === 'state') {
      const geo = getCountiesOfState(params.region)
        .map((d) => d.propertyId)
        .join(',');
      return fetchData(sensor, 'county', geo, params.date, {
        time_value: params.timeValue,
      });
    }
    if (params.region.level === 'county') {
      const state = getInfoByName(params.region.state);
      const geo = getCountiesOfState(state)
        .map((d) => d.propertyId)
        .join(',');

      return fetchData(sensor, 'county', geo, params.date, {
        time_value: params.timeValue,
      });
    }
    return fetchData(sensor, 'state', '*', params.date, {
      time_value: params.timeValue,
    });
  }

  let sortCriteria = 'displayName';
  let sortDirectionDesc = true;

  function applyDirection(comparator, sortDirectionDesc) {
    return sortDirectionDesc ? (a, b) => -comparator(a, b) : comparator;
  }
  function bySortCriteria(sortCriteria) {
    return (a, b) => {
      const av = a[sortCriteria];
      const bv = b[sortCriteria];
      if (av !== bv) {
        return av < bv ? -1 : 1;
      }
      return a.displayName.localeCompare(b.displayName);
    };
  }

  function sortClick(prop, defaultSortDesc = false) {
    if (sortCriteria === prop) {
      sortDirectionDesc = !sortDirectionDesc;
      return;
    }
    sortCriteria = prop;
    sortDirectionDesc = defaultSortDesc;
  }

  $: comparator = applyDirection(bySortCriteria(sortCriteria), sortDirectionDesc);

  $: regions = determineRegions(params.region);
  let sortedRegions = [];

  $: loadedData = loadData(sensor, params).then((rows) =>
    rows.map((row) => {
      const info = getInfoByName(row.geo_value);
      return Object.assign({}, info, row);
    }),
  );

  $: {
    sortedRegions = regions.slice();
    loadedData.then((rows) => {
      sortedRegions = rows.sort(comparator);
    });
  }
</script>

<style>
  table {
    border-collapse: collapse;
  }
  thead > tr {
    border-bottom: 1px solid #f0f1f3;
  }
  thead > tr > th {
    padding: 0.75rem 4px;
  }
  tbody {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  tbody > tr > td {
    padding: 0.75rem 4px;
    vertical-align: top;
  }

  tbody > tr:not(:last-of-type) {
    border-bottom: 1px solid #f0f1f3;
  }
</style>

<h2 class="mobile-h2">{sensor.name}</h2>

<table>
  <thead>
    <tr>
      <th class="mobile-th">
        <Top10SortHint
          label="Region"
          on:click={() => sortClick('displayName')}
          sorted={sortCriteria === 'displayName'}
          desc={sortDirectionDesc}>
          Region
        </Top10SortHint>
      </th>
      <th class="mobile-th uk-text-right">
        <Top10SortHint
          label="Change Last 7 days"
          on:click={() => sortClick('trend')}
          sorted={sortCriteria === 'trend'}
          desc={sortDirectionDesc}>
          Change Last 7 days
        </Top10SortHint>
      </th>
      <th class="mobile-th uk-text-right">
        <Top10SortHint
          label="Value"
          on:click={() => sortClick('value')}
          sorted={sortCriteria === 'value'}
          desc={sortDirectionDesc}>
          {#if sensor.isCasesSignal}per 100k{:else if sensor.format === 'percent'}Percentage{:else}Value{/if}
        </Top10SortHint>
      </th>
      <th class="mobile-th uk-text-right"><span>historical trend</span></th>
    </tr>
  </thead>
  <tbody>
    {#each sortedRegions as region}
      <tr>
        <td>{region.displayName}</td>
        <td class="uk-text-right">TODO</td>
        <td class="uk-text-right">{region.value == null ? 'N/A' : sensor.formatValue(region.value)}</td>
        <td>TODO</td>
      </tr>
    {/each}
  </tbody>
</table>
