<script>
  import { getCountiesOfState, getInfoByName, stateInfo } from '../../maps';
  import { fetchData, fetchTimeSlice, addMissing } from '../../data/fetchData';
  import getRelatedCounties from '../../maps/related';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
  import SparkLineTooltip from './SparkLineTooltip.svelte';
  import SortColumnIndicator from './SortColumnIndicator.svelte';
  import { fitRange } from '../../data';
  import chevronDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
  import FancyHeader from './FancyHeader.svelte';
  import TrendIndicator from './TrendIndicator.svelte';
  import { computeSparklineTimeFrame } from './utils';

  /**
   * @type {import("../utils").Params}
   */
  export let params;

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
  function loadData(params) {
    if (!params.sensor || !params.date || !params.region) {
      return Promise.resolve([]);
    }
    if (params.region.level === 'state') {
      const geo = getCountiesOfState(params.region).map((d) => d.propertyId);
      return params.fetchMultiRegions(params.sensor, 'county', geo);
    }
    if (params.region.level === 'county') {
      const geo = [params.region, ...getRelatedCounties(params.region)].map((d) => d.propertyId);

      return params.fetchMultiRegions(params.sensor, 'county', geo);
    }
    return params.fetchMultiRegions(params.sensor, 'state', '*');
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

  $: loadedData = loadData(params).then((rows) =>
    rows.map((row) => {
      const info = getInfoByName(row.geo_value);
      return Object.assign({}, info, row);
    }),
  );

  let showAll = false;

  $: {
    sortedRegions = regions.slice();
    loadedData.then((rows) => {
      sortedRegions = rows.sort(comparator).slice(0, showAll ? -1 : 10);
    });
  }
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = generateSparkLine({ highlightDate: true });

  function loadRegionData(sensor, regions, date) {
    if (!date || !regions || regions.length === 0) {
      return new Map();
    }
    const { min, max, difference } = computeSparklineTimeFrame(date, sensor);
    if (regions.length * difference < 3600) {
      // load all at once
      const data = fetchData(
        sensor,
        regions[0].level,
        regions === stateInfo ? '*' : regions.map((d) => d.propertyId),
        [min, max],
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
            return addMissing(fitRange(byRegion, sensor, min, max), sensor);
          }),
        ]),
      );
    }
    return new Map(
      regions.map((region) => [
        region.propertyId,
        fetchTimeSlice(sensor, region.level, region.propertyId, min, max, true, {
          displayName: region.displayName,
          geo_value: region.propertyId,
        }).then((rows) => addMissing(rows, sensor)),
      ]),
    );
  }

  $: regionData = loadRegionData(params.sensor, regions, params.date);
</script>

<style>
  .sparkline {
    padding: 0.75rem 4px 1px 4px !important;
  }

  .sparkline > :global(*) {
    height: 3em;
  }
</style>

<FancyHeader>{title.title}</FancyHeader>

<table class="mobile-table">
  <thead>
    <tr>
      <th class="mobile-th">{title.unit}</th>
      <th class="mobile-th uk-text-right">Change Last 7 days</th>
      <th class="mobile-th uk-text-right">
        {#if params.sensor.isCasesSignal}
          per 100k
        {:else if params.sensor.format === 'percent'}Percentage{:else}Value{/if}
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
        <td class="uk-text-right">
          <TrendIndicator trend={null} />
        </td>
        <td class="uk-text-right">{region.value == null ? 'N/A' : params.sensor.formatValue(region.value)}</td>
        <td class="sparkline">
          <Vega
            {spec}
            data={regionData.get(region.propertyId) || []}
            tooltip={SparkLineTooltip}
            tooltipProps={{ sensor: params.sensor }}
            signals={{ currentDate: params.date }} />
        </td>
      </tr>
    {/each}
  </tbody>
  {#if !showAll && regions.length > 10}
    <tfoot>
      <tr>
        <td colspan="5" class="uk-text-center">
          <button
            class="uk-button uk-button-default uk-button-delphi uk-button-delphi__secondary"
            on:click={() => (showAll = true)}>
            <span class="inline-svg-icon">
              {@html chevronDownIcon}
            </span>
            Show remaining
            {(regions.length - 10).toLocaleString()}
            regions
          </button>
        </td>
      </tr>
    </tfoot>
  {/if}
</table>
