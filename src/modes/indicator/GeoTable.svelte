<script>
  import { getCountiesOfState, getStateOfCounty, nationInfo, stateInfo } from '../../data/regions';
  import getRelatedCounties from '../../data/relatedRegions';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/vega/Vega.svelte';
  import SparkLineTooltip from '../../components/SparkLineTooltip.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import TrendIndicator from '../../components/TrendIndicator.svelte';
  import { formatDateISO, formatDateShortNumbers } from '../../formats';
  import SensorValue from '../../components/SensorValue.svelte';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import IndicatorAnnotations from '../../components/IndicatorAnnotations.svelte';
  import SortColumnIndicator, { SortHelper, byImportance } from '../../components/SortColumnIndicator.svelte';

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

  $: loadedData = loadData(sensor, date, region);

  let showAll = false;

  let loading = true;
  $: {
    loading = true;
    sortedRegions = regions.slice(0, showAll ? -1 : 10);
    const comparator = $sort.comparator;
    loadedData.then((rows) => {
      sortedRegions = rows.sort(comparator).slice(0, showAll ? -1 : 10);
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
</script>

<div class="uk-position-relative">
  <FancyHeader anchor="table">{title.title}</FancyHeader>
  <DownloadMenu {fileName} data={loadedData} absolutePos prepareRow={(row) => row.dump} />
</div>

<table class="mobile-table" class:loading>
  <thead>
    <tr>
      <th class="mobile-th">{title.unit}</th>
      <th class="mobile-th">Change Last 7 days</th>
      <th class="mobile-th uk-text-right">{sensor.unitShort}</th>
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
      <th class="sort-indicator">
        <SortColumnIndicator label="Change Last 7 days" {sort} prop="delta" />
      </th>
      <th class="sort-indicator">
        <SortColumnIndicator label="Value" {sort} prop="value" />
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
        <td>
          <TrendIndicator trend={r.trendObj} block />
        </td>
        <td class="uk-text-right table-value">
          <SensorValue {sensor} value={r.value} />
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
  {#if !showAll && regions.length > 10}
    <tfoot>
      <tr>
        <td colspan="5" class="uk-text-center">
          <button class="uk-button uk-button-text" on:click={() => (showAll = true)}>
            Show All ({regions.length - 10}
            remaining)
          </button>
        </td>
      </tr>
    </tfoot>
  {/if}
</table>

<style>
  .table-value {
    white-space: nowrap;
    font-weight: 700;
  }
</style>
