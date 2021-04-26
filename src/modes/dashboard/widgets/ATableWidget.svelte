<script context="module">
  export function toRow(id, name, sensor, region, date, trend, important = false) {
    return {
      important,
      id,
      name,
      highlight: new WidgetHighlight(sensor, region, date),
      sensor,
      region,
      date,
      trendObj: trend,

      delta: trend.delta,
      change: trend.change,
      value: trend.current ? trend.current.value : null,
    };
  }

  export const DEFAULT_STATE = {
    ...DEFAULT_WIDGET_STATE,
    width: 2,
    height: 3,
    sortCriteria: 'name',
    sortCriteriaDesc: false,
  };
</script>

<script>
  import WidgetCard, { DEFAULT_WIDGET_STATE } from './WidgetCard.svelte';
  import DownloadMenu from '../../../components/DownloadMenu.svelte';
  import SortColumnIndicator, { byImportance, SortHelper } from '../../../components/SortColumnIndicator.svelte';
  import TrendIndicator from '../../../components/TrendIndicator.svelte';
  import SensorValue from '../../../components/SensorValue.svelte';
  import { formatDateISO } from '../../../formats';
  import { WidgetHighlight } from '../highlight';
  import { SensorParam } from '../../../stores/params';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  export let id = undefined;

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam | import("../../../stores/params").TimeFrame}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionParam | string}
   */
  export let region;

  export let fileName;
  export let loadedRows = Promise.resolve([]);
  export let rowName = 'Row';

  export let top = 10;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  export let initialState = DEFAULT_STATE;

  const sort = new SortHelper(initialState.sortCriteria, initialState.sortCriteriaDesc, 'name', byImportance);

  let superState = {};
  $: state = {
    ...initialState,
    ...superState,
    sortCriteria: $sort.sortCriteria,
    sortCriteriaDesc: $sort.sortDirectionDesc,
  };
  $: {
    dispatch('state', { id, state });
  }

  function mergeState(event) {
    superState = event.detail;
  }

  let loading = true;
  let showAll = false;
  let sortedRows = [];
  let totalCount = 1;
  $: {
    loading = true;
    sortedRows = [];
    const comparator = $sort.comparator;
    loadedRows.then((rows) => {
      totalCount = rows.length;
      const sorted = rows.slice().sort(comparator);
      sortedRows = sorted.slice(0, showAll ? -1 : top);
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

  function toDump(row) {
    return {
      indicatorDataSource: row.sensor.id,
      indicatorId: row.sensor.signal,
      indicatorName: row.sensor.name,
      regionId: row.region.propertyId,
      regionLevel: row.region.level,
      regionName: row.region.displayName,
      date: formatDateISO(row.date.value),
      value: row.trendObj.current ? row.trendObj.current.value : '',
      trend: row.trendObj.trend,
      delta: row.trendObj.delta == null || Number.isNaN(row.trendObj.delta) ? '' : row.trendObj.delta,
      refDate: formatDateISO(row.trendObj.refDate),
      refValue: row.trendObj.ref ? row.trendObj.ref.value : '',
    };
  }
</script>

<WidgetCard
  {initialState}
  defaultState={DEFAULT_STATE}
  {sensor}
  {region}
  {date}
  titleUnit={false}
  on:action
  {id}
  on:state={mergeState}
  resizeMode="y"
>
  <svelte:fragment slot="toolbar">
    <DownloadMenu {fileName} data={sortedRows} prepareRow={(r) => toDump(r)} advanced={false} />
  </svelte:fragment>
  <table class="mobile-table" class:loading>
    <thead>
      <tr>
        <th class="mobile-th">{rowName}</th>
        <th class="mobile-th">Change Last 7 days</th>
        <th class="mobile-th uk-text-right">{typeof sensor === 'string' ? 'Value' : sensor.unitShort}</th>
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
            <SensorValue sensor={new SensorParam(r.sensor)} value={r.value} />
          </td>
        </tr>
      {/each}
    </tbody>
    {#if !showAll && totalCount > top}
      <tfoot>
        <tr>
          <td colspan="3" class="uk-text-center">
            <button
              class="uk-button uk-button-default uk-button-delphi uk-button-delphi__secondary"
              on:click={() => (showAll = true)}
            >
              Show All ({totalCount - top}
              remaining)
            </button>
          </td>
        </tr>
      </tfoot>
    {/if}
  </table>
</WidgetCard>

<style>
  .mobile-th {
    background: white;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tr.highlight {
    box-shadow: 0 0 3px 0 #888;
  }

  .table-value {
    white-space: nowrap;
    font-weight: 700;
  }
</style>
