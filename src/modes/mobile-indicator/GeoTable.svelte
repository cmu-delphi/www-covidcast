<script>
  import { getCountiesOfState, getInfoByName, stateInfo } from '../../maps';
  import { fetchData, fetchTimeSlice, addMissing } from '../../data/fetchData';
  import getRelatedCounties from '../../maps/related';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
  import SparkLineTooltip from '../mobile/SparkLineTooltip.svelte';
  import SortColumnIndicator from './SortColumnIndicator.svelte';
  import { timeWeek } from 'd3-time';
  import { fitRange } from '../../data';

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
      return [region, ...getRelatedCounties(region)];
    }
    return stateInfo;
  }

  /**
   * @param {import('../../maps').NameInfo} region
   */
  function determineTitle(region) {
    if (region.level === 'state') {
      return { title: `Counties of ${region.displayName}`, unit: 'County' };
    }
    if (region.level === 'county') {
      return { title: `Neighboring Counties`, unit: 'County' };
    }
    return { title: 'US States', unit: 'State' };
  }

  /**
   * @param {import('../../stores/constants').SensorEntry} sensor
   * @param {import("../utils").Params} params
   */
  function loadData(sensor, params) {
    if (!params.date || !params.region) {
      return Promise.resolve([]);
    }
    if (params.region.level === 'state') {
      const geo = getCountiesOfState(params.region).map((d) => d.propertyId);
      return fetchData(sensor, 'county', geo, params.date, {
        time_value: params.timeValue,
      });
    }
    if (params.region.level === 'county') {
      const geo = [params.region, ...getRelatedCounties(params.region)].map((d) => d.propertyId);

      return fetchData(sensor, 'county', geo, params.date, {
        time_value: params.timeValue,
      });
    }
    return fetchData(sensor, 'state', '*', params.date, {
      time_value: params.timeValue,
    });
  }

  let sortCriteria = 'displayName';
  let sortDirectionDesc = false;

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

  $: title = determineTitle(params.region);
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
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = generateSparkLine();

  function loadRegionData(sensor, regions, date) {
    if (!date || !regions || regions.length === 0) {
      return new Map();
    }
    const startDate = timeWeek.offset(date, -4);
    if (regions.length * 28 < 3600) {
      // load all at once
      const data = fetchData(
        sensor,
        regions[0].level,
        regions === stateInfo ? '*' : regions.map((d) => d.propertyId),
        [startDate, date],
        {},
        { multiValues: false },
      );
      return new Map(
        regions.map((region) => [
          region.propertyId,
          data.then((rows) => {
            let byRegion = rows.filter((d) => d.geo_value.toUpperCase() === region.propertyId.toUpperCase());
            for (const row of byRegion) {
              row.displayName = region.displayName;
            }
            return addMissing(fitRange(byRegion, sensor, startDate, date), sensor);
          }),
        ]),
      );
    }
    return new Map(
      regions.map((region) => [
        region.propertyId,
        fetchTimeSlice(sensor, region.level, region.propertyId, startDate, date, true, {
          displayName: region.displayName,
          geo_value: region.propertyId,
        }).then((rows) => addMissing(rows, sensor)),
      ]),
    );
  }

  $: regionData = loadRegionData(sensor, regions, params.date);
</script>

<style>
</style>

<h2 class="mobile-h2">{title.title}</h2>

<table class="mobile-table">
  <thead>
    <tr>
      <th class="mobile-th">{title.unit}</th>
      <th class="mobile-th uk-text-right">Change Last 7 days</th>
      <th class="mobile-th uk-text-right">
        {#if sensor.isCasesSignal}per 100k{:else if sensor.format === 'percent'}Percentage{:else}Value{/if}
      </th>
      <th class="mobile-th uk-text-right"><span>historical trend</span></th>
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator
          label={title.unit}
          on:click={(e) => sortClick('name', e.detail || false)}
          sorted={sortCriteria === 'name'}
          desc={sortDirectionDesc} />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Change Last 7 days"
          on:click={(e) => sortClick('trend', e.detail || false)}
          sorted={sortCriteria === 'trend'}
          desc={sortDirectionDesc} />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Value"
          on:click={(e) => sortClick('value', e.detail || false)}
          sorted={sortCriteria === 'value'}
          desc={sortDirectionDesc} />
      </th>
      <th class="sort-indicator" />
    </tr>
  </thead>
  <tbody>
    {#each sortedRegions as region}
      <tr>
        <td>
          <a
            href="?region={region.propertyId}"
            class="uk-link-text"
            on:click|preventDefault={() => params.setRegion(region)}>{region.displayName}</a>
        </td>
        <td class="uk-text-right">TODO</td>
        <td class="uk-text-right">{region.value == null ? 'N/A' : sensor.formatValue(region.value)}</td>
        <td>
          <Vega
            {spec}
            data={regionData.get(region.propertyId) || []}
            tooltip={SparkLineTooltip}
            tooltipProps={{ sensor }}
            signals={{ currentDate: params.date }} />
        </td>
      </tr>
    {/each}
  </tbody>
</table>
