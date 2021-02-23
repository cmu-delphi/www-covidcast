<script>
  import { getCountiesOfState, stateInfo } from '../../maps';
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
  import { currentRegion } from '../../stores';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;

  /**
   * @param {import("../../stores/params").Region} region
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
   * @param {import("../../stores/params").Region} region
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

  function addMissingGeo(geo) {
    return (rows) => {
      if (rows.length >= geo.length) {
        return rows;
      }
      const existing = new Set(rows.map((r) => r.id));
      const missing = geo.filter((d) => !existing.has(d.id));
      for (const m of missing) {
        rows.push({
          geo_value: m.propertyId,
          value: null,
          stderr: null,
          ...m,
        });
      }
      return rows;
    };
  }

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadData(sensor, date, region) {
    if (!sensor.value || !date.value || !region.value) {
      return Promise.resolve([]);
    }
    if (region.level === 'state') {
      const geo = getCountiesOfState(region.value);
      return date
        .fetchMultiRegions(
          sensor.value,
          'county',
          geo.map((d) => d.propertyId),
        )
        .then(addMissingGeo(geo));
    }
    if (region.level === 'county') {
      const geo = [region.value, ...getRelatedCounties(region.value)];

      return date
        .fetchMultiRegions(
          sensor.value,
          'county',
          geo.map((d) => d.propertyId),
        )
        .then(addMissingGeo(geo));
    }
    return date.fetchMultiRegions(sensor.value, 'state', '*');
  }

  let sortCriteria = 'displayName';
  let sortDirectionDesc = false;

  function bySortCriteria(sortCriteria, sortDirectionDesc) {
    const less = sortDirectionDesc ? 1 : -1;
    return (a, b) => {
      const av = a[sortCriteria];
      const bv = b[sortCriteria];
      if ((av == null) !== (bv == null)) {
        return av == null ? 1 : -1;
      }
      if (av !== bv) {
        return av < bv ? less : -less;
      }
      if (a.displayName !== b.displayName) {
        return a.displayName < b.displayName ? less : -less;
      }
      return 0;
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

  $: comparator = bySortCriteria(sortCriteria, sortDirectionDesc);

  $: title = determineTitle(region.value);
  $: regions = determineRegions(region.value);

  let sortedRegions = [];

  $: loadedData = loadData(sensor, date, region);

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

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").Region[]} region
   */
  function loadRegionData(sensor, date, regions) {
    if (!date.value || !regions || regions.length === 0) {
      return new Map();
    }
    const { min, max, difference } = date.sparkLine;
    // TODO
    if (regions.length * difference < 3600) {
      // load all at once
      const data = fetchData(
        sensor.value,
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
            return addMissing(fitRange(byRegion, sensor.value, min, max), sensor.value);
          }),
        ]),
      );
    }
    return new Map(
      regions.map((region) => [
        region.propertyId,
        fetchTimeSlice(sensor.value, region.level, region.propertyId, min, max, true, {
          displayName: region.displayName,
          geo_value: region.propertyId,
        }).then((rows) => addMissing(rows, sensor.value)),
      ]),
    );
  }

  $: regionData = loadRegionData(sensor, date, regions);
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
        {#if sensor.isCasesSignal}per 100k{:else if sensor.isPercentage}Percentage{:else}Value{/if}
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
            on:click|preventDefault={() => currentRegion.set(region.propertyId)}>{region.displayName}</a>
        </td>
        <td class="uk-text-right">
          <TrendIndicator trend={null} {sensor} />
        </td>
        <td class="uk-text-right">{region.value == null ? 'N/A' : sensor.value.formatValue(region.value)}</td>
        <td class="sparkline">
          <Vega
            {spec}
            data={regionData.get(region.propertyId) || []}
            tooltip={SparkLineTooltip}
            tooltipProps={{ sensor: sensor.value }}
            signals={{ currentDate: date.value }} />
        </td>
      </tr>
    {/each}
  </tbody>
  {#if !showAll && sortedRegions.length > 10}
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
            {(sortedRegions.length - 10).toLocaleString()}
            regions
          </button>
        </td>
      </tr>
    </tfoot>
  {/if}
</table>
