<script>
  import { determineTrend, findDateRow, findMaxRow } from './trend';
  import { formatValue, formatDate, formatDelta } from './format';
  /**
   * date to highlight
   * @type {Date}
   */
  export let date;
  /**
   * data to show
   * @type {Promise<import("../../data").EpiDataRow[]>}
   */
  export let data = Promise.resolve([]);

  let loading = true;

  async function deriveData(dataPromise, date) {
    loading = true;
    const data = await dataPromise;
    const dateRow = findDateRow(date, data);
    const trend = determineTrend(date, data, dateRow);
    const max = findMaxRow(data);
    loading = false;

    return {
      data,
      row: dateRow,
      trend,
      max,
    };
  }

  $: summary = deriveData(data, date);
</script>

<style>
  .summary {
    display: flex;
  }
  .block {
    padding: 0.5em;
    line-height: 115%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>

<div class:loading class="summary">
  {#await summary then s}
    <div class="block">
      <span> <strong>{s.row ? formatValue(s.row.value) : '?'}</strong> per 1,000 </span>
      <span>people</span>
      <span>on {formatDate(date)}</span>
    </div>
    <div class="block">
      <strong>{s.trend.trend}</strong>
      <span>{formatDelta(s.trend.delta)} compared </span>
      <span>to {formatDate(s.trend.refDate)}</span>
    </div>
    <div class="block">
      <span> <strong>{s.max ? formatValue(s.max.value) : '?'}</strong> per 1,000 </span>
      <span>highest value</span>
      <span>on {s.max ? formatDate(s.max.date_value) : '?'}</span>
    </div>
  {/await}
</div>
