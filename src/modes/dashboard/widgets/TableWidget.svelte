<script>
  import WidgetCard from './WidgetCard.svelte';
  import { getContext } from 'svelte';
  import DownloadMenu from '../../../components/DownloadMenu.svelte';
  import { formatDateISO } from '../../../formats';
  import { WidgetHighlight } from '../highlight';
  // import isEqual from 'lodash-es/isEqual';
  import SortColumnIndicator from '../../../components/Table/SortColumnIndicator.svelte';
  import TrendIndicator from '../../../components/TrendIndicator.svelte';
  import SensorValue from '../../../components/SensorValue.svelte';
  import { byImportance, SortHelper } from '../../../components/Table/tableUtils';
  import { determineTrend } from '../../../stores/trend';
  import { infosByLevel, nationInfo } from '../../../data/regions';
  import { groupByRegion } from '../../../stores/params';
  import WidgetTitle from './WidgetTitle.svelte';
  import { getLevelInfo } from '../../../stores';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionLevel}
   */
  export let level;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  /**
   * @type {import("../../../stores/params").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  /**
   * @typedef {object} TableRow
   * @property {string} id
   * @property {string} name
   * @property {import("../../../stores/params").Region} region
   * @property {import('../highlight').WidgetHighlight} highlight
   * @property {boolean} important
   */

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").Region} region
   * @param {import("../../../stores/params").DateParam} date
   * @returns {TableRow}
   */
  function toTableRow(sensor, region, date, important = false) {
    return {
      important,
      id: region.propertyId,
      name: region.displayName,
      region,
      highlight: new WidgetHighlight(sensor.value, region, date.value),

      delta: null,
      change: null,
      value: null,
    };
  }
  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").DateParam} date
   * @param {import("../../../stores/params").RegionLevel} level
   * @returns {Promise<TableRows[]>}
   */
  function loadData(sensor, date, level) {
    if (!sensor.value || !date.value || !level) {
      return Promise.resolve([]);
    }
    function toGeoTableRow(r, data, important = false) {
      const trend = determineTrend(date.value, data, sensor.highValuesAre);
      return {
        ...toTableRow(sensor, r, date, important),
        trendObj: trend,
        delta: trend.delta,
        change: trend.change,
        value: trend.current ? trend.current.value : null,
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
          delta: trend.delta == null || Number.isNaN(trend.delta) ? '' : trend.delta,
          refDate: formatDateISO(trend.refDate),
          refValue: trend.ref ? trend.ref.value : '',
        },
      };
    }
    function loadImpl(regions, isAll = false) {
      return fetcher.fetch1SensorNRegionsNDates(sensor, regions, date.windowTimeFrame, isAll).then((data) => {
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
    // if (region.level === 'county') {
    //   return Promise.all([
    //     loadSingle(nationInfo, true),
    //     loadSingle(getStateOfCounty(region.value), true),
    //     loadSingle(region.value),
    //     loadImpl(getRelatedCounties(region.value)),
    //   ]).then((r) => r.flat());
    // }
    const regions = infosByLevel[level];
    return Promise.all([loadSingle(nationInfo, true), loadImpl(regions)]).then((r) => r.flat());
  }

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").RegionLevel level
   * @param {import("../../../stores/params").DateParam} date
   */
  function generateFileName(sensor, level, date) {
    return `${sensor.name}_${getLevelInfo(level).labelPlural}_${formatDateISO(date.value)}`;
  }

  const sort = new SortHelper('value', true, 'name', byImportance);

  $: shownLevel = level === 'nation' ? 'state' : level;

  const rowName = 'Region';
  $: rows = [nationInfo, ...infosByLevel[shownLevel]].map((r) => toTableRow(sensor, r, date, r === nationInfo));

  $: loadedRows = loadData(sensor, date, shownLevel);

  $: fileName = generateFileName(sensor, shownLevel, date);

  let loading = true;
  let showAll = false;
  /**
   * @type {TableRow[]}
   */
  let sortedRows = [];
  $: {
    loading = true;
    sortedRows = rows.slice(0, showAll ? -1 : 10);
    const comparator = $sort.comparator;
    loadedRows.then((rows) => {
      sortedRows = rows.sort(comparator).slice(0, showAll ? -1 : 10);
      loading = false;
    });
  }

  function onMouseEnter(r) {
    if (!r.highlight.equals(highlight)) {
      highlight = r.highlight;
    }
  }

  function onMouseLeave() {
    highlight = null;
  }
</script>

<WidgetCard grid={{ width: 2, height: 3 }}>
  <div class="content">
    <WidgetTitle {sensor} region="US {getLevelInfo(shownLevel).labelPlural}" {date} unit={false}>
      <DownloadMenu
        slot="addons"
        {fileName}
        data={sortedRows}
        prepareRows={(r) => r.dump}
        absolutePos="bottom: unset; top: 0;"
        advanced={false}
      />
    </WidgetTitle>
    <div class="table-wrapper">
      <div class="table-scroller">
        <table class="mobile-table" class:loading>
          <thead>
            <tr>
              <th class="mobile-th">{rowName}</th>
              <th class="mobile-th">Change Last 7 days</th>
              <th class="mobile-th uk-text-right">{sensor.unitShort}</th>
            </tr>
            <tr>
              <th class="sort-indicator uk-text-center">
                <SortColumnIndicator label={rowName} {sort} prop="name" />
              </th>
              <th class="sort-indicator">
                <SortColumnIndicator label="Change Last 7 days" {sort} prop="delta" />
              </th>
              <th class="sort-indicator">
                <SortColumnIndicator label="Value" {sort} prop="value" />
              </th>
            </tr>
          </thead>
          <tbody>
            {#each sortedRows as r (r.id)}
              <tr
                class:important={r.important}
                class:highlight={r.highlight.equals(highlight)}
                on:mouseenter={() => onMouseEnter(r)}
                on:mouseleave={onMouseLeave}
              >
                <td>
                  {r.name}
                </td>
                <td>
                  <TrendIndicator trend={r.trendObj} block />
                </td>
                <td class="uk-text-right table-value">
                  <SensorValue {sensor} value={r.value} />
                </td>
              </tr>
            {/each}
          </tbody>
          {#if !showAll && rows.length > 10}
            <tfoot>
              <tr>
                <td colspan="3" class="uk-text-center">
                  <button
                    class="uk-button uk-button-default uk-button-delphi uk-button-delphi__secondary"
                    on:click={() => (showAll = true)}
                  >
                    Show All ({rows.length - 10}
                    remaining)
                  </button>
                </td>
              </tr>
            </tfoot>
          {/if}
        </table>
      </div>
    </div>
  </div>
</WidgetCard>

<style>
  .content {
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .table-wrapper {
    position: relative;
    flex: 1 1 0;
  }
  .table-scroller {
    position: absolute;
    overflow: auto;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
  .table-scroller .mobile-th {
    background: white;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tr.highlight {
    box-shadow: 0 0 3px 0 #888;
  }
</style>
