<script>
  import { getCountiesOfState, getStateOfCounty, nationInfo, stateInfo } from '../../maps';
  import getRelatedCounties from '../../maps/related';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
  import SparkLineTooltip from './SparkLineTooltip.svelte';
  import SortColumnIndicator from './SortColumnIndicator.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import TrendIndicator from './TrendIndicator.svelte';
  import { formatDateISO, formatDateShortNumbers } from '../../formats';
  import { groupByRegion, extractSparkLine } from '../../stores/params';
  import { determineTrend } from '../../stores/trend';
  import SensorValue from './SensorValue.svelte';
  import SensorUnit from './SensorUnit.svelte';
  import DownloadMenu from './components/DownloadMenu.svelte';

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
   * @type {import("../../stores/params").DataFetcher}
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
    function toGeoTableRow(r, data, important = false) {
      const trend = determineTrend(date.value, data, sensor.isInverted);
      return {
        ...r,
        important,
        trendObj: trend,
        delta: trend.delta,
        change: trend.change,
        value: trend.current ? trend.current.value : null,
        data: data.length > 0 ? extractSparkLine(data, date.sparkLineTimeFrame, sensor.value) : [],
        dump: {
          indicatorDataSource: sensor.value.id,
          indicatorId: sensor.value.signal,
          indicatorName: sensor.name,
          regionId: r.propertyId,
          regionLevel: r.level,
          regionName: r.displayName,
          date: formatDateISO(date.value),
          value: trend.current ? trend.current.value : '',
          trend: trend.trend,
          delta: trend.delta == null ? '' : trend.delta,
          refDate: formatDateISO(trend.refDate),
          refValue: trend.ref ? trend.ref.value : '',
        },
      };
    }
    function loadImpl(regions) {
      return fetcher.fetch1SensorNRegionsNDates(sensor, regions, date.windowTimeFrame).then((data) => {
        const groups = groupByRegion(data);
        return regions.map((region) => {
          const data = groups.get(region.propertyId) || [];
          return toGeoTableRow(region, data);
        });
      });
    }
    function loadSingle(r, important = false) {
      return fetcher
        .fetch1Sensor1RegionNDates(sensor, r, date.windowTimeFrame)
        .then((rows) => toGeoTableRow(r, rows, important));
    }

    if (region.level === 'state') {
      return Promise.all([
        loadSingle(nationInfo, true),
        loadSingle(region.value, true),
        loadImpl(getCountiesOfState(region.value)),
      ]).then((r) => r.flat());
    }
    if (region.level === 'county') {
      return Promise.all([
        loadSingle(nationInfo, true),
        loadSingle(getStateOfCounty(region.value), true),
        loadSingle(region.value),
        loadImpl(getRelatedCounties(region.value)),
      ]).then((r) => r.flat());
    }
    return Promise.all([loadSingle(nationInfo, true), loadImpl(stateInfo)]).then((r) => r.flat());
  }

  let sortCriteria = 'displayName';
  let sortDirectionDesc = false;

  function bySortCriteria(sortCriteria, sortDirectionDesc) {
    const less = sortDirectionDesc ? 1 : -1;

    function clean(a) {
      // normalize NaN to null
      return typeof a === 'number' && Number.isNaN(a) ? null : a;
    }
    return (a, b) => {
      if (a.important && b.important) {
        // state vs nation
        return a.level === 'nation' ? -1 : 1;
      }
      if (a.important !== b.important) {
        return a.important ? -1 : 1;
      }
      const av = clean(a[sortCriteria]);
      const bv = clean(b[sortCriteria]);
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
  <FancyHeader>{title.title}</FancyHeader>
  <DownloadMenu {fileName} data={loadedData} absolutePos prepareRow={(row) => row.dump} />
</div>

<table class="mobile-table">
  <thead>
    <tr>
      <th class="mobile-th mobile-th-blue">{title.unit}</th>
      <th class="mobile-th mobile-th-blue">Change Last 7 days</th>
      <th class="mobile-th uk-text-right mobile-th-blue">
        <SensorUnit {sensor} force />
      </th>
      <th class="mobile-th uk-text-right mobile-th-blue">
        <span>historical trend</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(date.sparkLineTimeFrame.min)} </span>
          <span> {formatDateShortNumbers(date.sparkLineTimeFrame.max)} </span>
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
          on:click={() => sortClick('delta')}
          sorted={sortCriteria === 'delta'}
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
    {#each sortedRegions as r}
      <tr class:important={r.important}>
        <td>
          <a
            href="?region={r.propertyId}"
            class="uk-link-text"
            on:click|preventDefault={() => region.set(r, true)}>{r.displayName}</a>
        </td>
        <td>
          <TrendIndicator trend={r.trendObj} {sensor} block />
        </td>
        <td class="uk-text-right">
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
              noDataText="N/A" />
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
