<script>
  import mousePointerIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/regular/hand-pointer.svg';
  import { getCountiesOfState, getStateOfCounty, nationInfo, stateInfo } from '../../data/regions';
  import getRelatedCounties from '../../data/relatedRegions';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/vega/Vega.svelte';
  import SparkLineTooltip from '../../components/SparkLineTooltip.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import { formatDateISO, formatDateShortNumbers, formatFraction } from '../../formats';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import IndicatorAnnotations from '../../components/IndicatorAnnotations.svelte';
  import SortColumnIndicator, { SortHelper, byImportance } from '../../components/SortColumnIndicator.svelte';
  import SensorUnit from '../../components/SensorUnit.svelte';
  import UiKitHint from '../../components/UIKitHint.svelte';

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
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  /**
   * @param {import("../../stores/params").Region} region
   */
  function determineRegions(region) {
    if (region.level === 'state') {
      return [nationInfo, region, ...getCountiesOfState(region)];
    }
    if (region.level === 'county') {
      return [nationInfo, getStateOfCounty(region), region, ...getRelatedCounties(region)];
    }
    return [nationInfo, ...stateInfo];
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
    const regions = [[nationInfo, true]];

    if (region.level === 'state') {
      regions.push([region.value, true]);
      for (const county of getCountiesOfState(region.value)) {
        regions.push([county, false]);
      }
    } else if (region.level === 'county') {
      regions.push([getStateOfCounty(region.value), true]);
      regions.push([region.value, false]);
      for (const county of getRelatedCounties(region.value)) {
        regions.push([county, false]);
      }
    } else {
      for (const state of stateInfo) {
        regions.push([state, false]);
      }
    }

    const trends = fetcher.fetch1SensorNRegionsDateTrend(
      sensor,
      regions.map((r) => r[0]),
      date,
    );
    const sparklines = fetcher.fetch1SensorNRegionsSparklines(
      sensor,
      regions.map((r) => r[0]),
      date,
    );
    return Promise.all(
      regions.map(([region, important]) => {
        return Promise.all([trends.shift(), sparklines.shift()]).then(([trendObj, sparklineRows]) => ({
          ...region,
          important,
          trendObj,
          delta: trendObj.delta,
          change: trendObj.change,
          value: trendObj ? trendObj.value : null,
          data: sparklineRows,
          dump: {
            indicatorDataSource: sensor.value.id,
            indicatorId: sensor.value.signal,
            indicatorName: sensor.name,
            regionId: region.propertyId,
            regionLevel: region.level,
            regionName: region.displayName,
            date: formatDateISO(date.value),
            value: trendObj ? trendObj.value : '',
            trend: trendObj.trend,
            delta: trendObj.delta == null || Number.isNaN(trendObj.delta) ? '' : trendObj.delta,
            refDate: formatDateISO(trendObj.refDate),
            refValue: trendObj ? trendObj.refValue : '',
          },
        }));
      }),
    );
  }

  const sort = new SortHelper('displayName', false, 'displayName', byImportance);

  $: title = determineTitle(region.value);
  $: regions = determineRegions(region.value);

  let sortedRegions = [];
  let missingRegions = [];

  $: loadedData = loadData(sensor, date, region);

  let showAll = false;

  let loading = true;

  $: {
    loading = true;
    sortedRegions = regions.slice(0, showAll ? -1 : 10);
    missingRegions = [];
    const comparator = $sort.comparator;
    loadedData.then((rows) => {
      const data = rows.sort(comparator);
      const isValid = (d) =>
        d.important || d.id === region.id || d.data.some((v) => v.value != null && !Number.isNaN(v.value));
      const filtered = data.filter(isValid);
      missingRegions = data.filter((d) => !isValid(d));
      sortedRegions = filtered.slice(0, showAll ? -1 : 10);
      loading = false;
    });
  }
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = generateSparkLine({ highlightDate: true, domain: date.sparkLineTimeFrame.domain });

  function generateFileName(sensor, region, date) {
    let regionName = 'US States';
    if (region.level === 'state') {
      regionName = `${region.displayName} Counties`;
    } else if (region.level === 'county') {
      regionName = `${region.displayName} Neighboring Counties`;
    }
    return `${sensor.name}_${regionName}_${formatDateISO(date.value)}_Trends`;
  }

  $: fileName = generateFileName(sensor, region, date);

  function missingRegionsText(regions) {
    if (regions.length > 5) {
      return `${regions
        .slice(0, 5)
        .map((d) => d.displayName)
        .join(', ')}, and ${regions.length - 5} more`;
    }
    return regions.map((d) => d.displayName).join(', ');
  }
</script>

<div class="uk-position-relative">
  <FancyHeader anchor="table">{title.title}</FancyHeader>
  <DownloadMenu {fileName} data={loadedData} absolutePos prepareRow={(row) => row.dump} />
  <p class="uk-text-center uk-text-italic ux-hint">
    <span class="inline-svg-icon">
      {@html mousePointerIcon}
    </span>
    Click on a region name to explore furthre
  </p>
</div>

<table class="mobile-table" class:loading>
  <thead>
    <tr>
      <th class="mobile-th">{title.unit}</th>
      <th class="mobile-th uk-text-right" colspan="2">Value</th>
      <th class="mobile-th uk-text-right"><span>Relative Change to Previous Week</span></th>
      <th class="mobile-th uk-text-right">
        <span>historical trend</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(date.sparkLineTimeFrame.min)} </span>
          <span> {formatDateShortNumbers(date.sparkLineTimeFrame.max)} </span>
        </div>
      </th>
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label={title.unit} {sort} prop="displayName" />
      </th>
      <th class="sort-indicator" colspan="2">
        <SortColumnIndicator label="Value" {sort} prop="value" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Change Last 7 days" {sort} prop="delta" />
      </th>
      <th class="sort-indicator" />
    </tr>
  </thead>
  <tbody>
    {#each sortedRegions as r (r.propertyId)}
      <tr class:important={r.important}>
        <td>
          <IndicatorAnnotations asHint {sensor} region={r} {date} range="sparkLine" className="mobile-row-annotation" />
          <a href="?region={r.propertyId}" class="uk-link-text" on:click|preventDefault={() => region.set(r, true)}
            >{r.displayName}</a
          >
        </td>
        <td class="uk-text-right bold-value table-value">
          {#if r.value == null || Number.isNaN(r.value)}
            N/A
          {:else}
            {sensor.formatValue(r.value)}
          {/if}
        </td>
        <td class="bold-value table-unit">
          {#if r.value != null && !Number.isNaN(r.value)}
            <SensorUnit {sensor} />
          {/if}
        </td>
        <td class="uk-text-right bold-value">
          {#if r.trendObj == null || r.trendObj.value == null || Number.isNaN(r.value) || r.trendObj.change == null}
            N/A
          {:else}
            {formatFraction(r.trendObj.change, true)}
          {/if}
        </td>
        <td>
          <div class="mobile-table-chart mobile-table-chart-small">
            <Vega
              {spec}
              data={r.data}
              tooltip={SparkLineTooltip}
              tooltipProps={{ sensor }}
              signals={{ currentDate: date.value }}
              noDataText="N/A"
            />
          </div>
        </td>
      </tr>
    {/each}
  </tbody>
  {#if missingRegions.length > 0}
    <tfoot>
      <tr>
        <td colspan="5" class="uk-text-center">
          {missingRegions.length}
          {missingRegions.length > 1 ? 'locations' : 'location'}
          <UiKitHint title={missingRegionsText(missingRegions)} inline noMargin />
          have been omitted because of missing values
        </td>
      </tr>
    </tfoot>
  {/if}
  {#if !showAll && regions.length - missingRegions.length > 10}
    <tfoot>
      <tr>
        <td colspan="5" class="uk-text-center">
          <button class="uk-button uk-button-text" on:click={() => (showAll = true)}>
            Show All ({regions.length - missingRegions.length - 10}
            remaining)
          </button>
        </td>
      </tr>
    </tfoot>
  {/if}
</table>

<style>
  .bold-value {
    white-space: nowrap;
    font-weight: 700;
  }

  .table-value {
    padding-right: 0 !important;
  }

  .table-unit {
    padding-left: 1px !important;
  }

  .ux-hint {
    font-size: 90%;
  }
</style>
