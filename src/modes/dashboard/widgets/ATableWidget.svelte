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
      value: trend.value,
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
  import SensorValue from '../../../components/SensorValue.svelte';
  import { formatDateISO, formatFraction } from '../../../formats';
  import { WidgetHighlight } from '../highlight';
  import { SensorParam } from '../../../stores/params';
  import { createEventDispatcher } from 'svelte';
  import { metaDataManager } from '../../../stores';

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

  export let top = 15;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  /**
   * @type {'full' | 'date' | 'region' | 'sensor'}
   */
  export let highlightMatch = 'full';

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
    superState = event.detail.state;
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
      value: row.trendObj.value,
      trend: row.trendObj.trend,
      delta: row.trendObj.delta == null || Number.isNaN(row.trendObj.delta) ? '' : row.trendObj.delta,
      refDate: formatDateISO(row.trendObj.refDate),
      refValue: row.trendObj.refValue,
    };
  }

  function matchHighlight(rowHighlight, highlight) {
    if (!highlight) {
      return false;
    }
    switch (highlightMatch) {
      case 'region':
        return highlight.matchRegion(rowHighlight.primaryRegion);
      case 'sensor':
        return highlight.matchSensor(rowHighlight.primarySensor);
      case 'date':
        return highlight.matchDate(rowHighlight.primaryDate);
      default:
        return rowHighlight.equals(highlight);
    }
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
        <th class="mobile-th uk-text-right">Relative change to 7 days ago</th>
        <th class="mobile-th uk-text-right">{typeof sensor === 'string' ? 'Value' : sensor.unitShort}</th>
      </tr>
      <tr>
        <th class="sort-indicator uk-text-center">
          <SortColumnIndicator label={rowName} {sort} prop="name" />
        </th>
        <th class="sort-indicator">
          <SortColumnIndicator label="Change Last 7 days" {sort} prop="change" />
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
          class:highlight={matchHighlight(r.highlight, highlight)}
          on:mouseenter={() => onMouseEnter(r)}
          on:mouseleave={onMouseLeave}
        >
          <td>
            {r.name}
          </td>
          <td class="uk-text-right table-value">
            {formatFraction(r.trendObj.change, true)}
          </td>
          <td class="uk-text-right table-value">
            <SensorValue sensor={new SensorParam(r.sensor, $metaDataManager)} value={r.value} />
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
