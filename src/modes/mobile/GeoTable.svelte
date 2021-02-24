<script>
  import { getCountiesOfState, stateInfo } from '../../maps';
  import getRelatedCounties from '../../maps/related';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
  import SparkLineTooltip from './SparkLineTooltip.svelte';
  import SortColumnIndicator from './SortColumnIndicator.svelte';
  import chevronDownIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
  import FancyHeader from './FancyHeader.svelte';
  import TrendIndicator from './TrendIndicator.svelte';
  import { currentRegion } from '../../stores';
  import { formatDateShortNumbers } from '../../formats';
  import { groupByRegion, extractSparkLine } from '../../stores/params';
  import { determineTrend } from '../../stores/trend';

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
      return { title: `${region.displayName} Counties`, unit: 'County' };
    }
    if (region.level === 'county') {
      return { title: `Neighboring Counties`, unit: 'County' };
    }
    return { title: 'US States', unit: 'State' };
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
    function loadImpl(regions) {
      return sensor.fetchMultiTimeSeries(regions).then((data) => {
        const groups = groupByRegion(data);
        return regions.map((region) => {
          const data = groups.get(region.propertyId) || [];
          const trend = determineTrend(date.value, data);
          return {
            ...region,
            trendObj: trend,
            trend: trend.change,
            value: trend.current ? trend.current.value : null,
            data: data.length > 0 ? extractSparkLine(data, date.sparkLine, sensor.value) : [],
          };
        });
      });
    }
    if (region.level === 'state') {
      return loadImpl(getCountiesOfState(region.value));
    }
    if (region.level === 'county') {
      const geo = [region.value, ...getRelatedCounties(region.value)];
      return loadImpl(geo);
    }
    return loadImpl(stateInfo);
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
    sortedRegions = regions.slice(0, showAll ? -1 : 10);
    loadedData.then((rows) => {
      sortedRegions = rows.sort(comparator).slice(0, showAll ? -1 : 10);
    });
  }
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = generateSparkLine({ highlightDate: true });
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
      <th class="mobile-th mobile-th-blue">{title.unit}</th>
      <th class="mobile-th mobile-th-blue">Change Last 7 days</th>
      <th class="mobile-th uk-text-right mobile-th-blue">
        {#if sensor.isCasesSignal}per 100k{:else if sensor.isPercentage}Percentage{:else}Value{/if}
      </th>
      <th class="mobile-th uk-text-right mobile-th-blue">
        <span>historical trend</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(date.sparkLine.min)} </span>
          <span> {formatDateShortNumbers(date.sparkLine.max)} </span>
        </div>
      </th>
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator
          label={title.unit}
          on:click={() => sortClick('displayName')}
          sorted={sortCriteria === 'displayName'}
          desc={sortDirectionDesc} />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Change Last 7 days"
          on:click={() => sortClick('trend')}
          sorted={sortCriteria === 'trend'}
          desc={sortDirectionDesc} />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator
          label="Value"
          on:click={() => sortClick('value')}
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
        <td>
          <TrendIndicator trend={region.trendObj} {sensor} />
        </td>
        <td class="uk-text-right">{region.value == null ? 'N/A' : sensor.value.formatValue(region.value)}</td>
        <td class="sparkline">
          <Vega
            {spec}
            data={region.data}
            tooltip={SparkLineTooltip}
            tooltipProps={{ sensor: sensor.value }}
            signals={{ currentDate: date.value }} />
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
