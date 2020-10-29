<script>
  import { determineTrend, findDateRow, findMaxRow, findMinRow } from './trend';
  import { formatValue, formatDelta, formatSampleSize, formatIssueDate, formatStdErr } from './format';
  import Vega from '../../components/Vega.svelte';
  import { formatDateShort } from '../../formats';
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

  export let low = false;

  export let spec;

  let loading = true;
  let maxDate = null;

  async function deriveData(dataPromise, date) {
    loading = true;
    const data = await dataPromise;
    const dateRow = findDateRow(date, data);
    const trend = determineTrend(date, data, dateRow);
    const max = low ? findMinRow(data) : findMaxRow(data);
    maxDate = max ? max.date_value : null;
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
    align-items: center;
  }
  .block {
    padding: 0.5em;
    line-height: 115%;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 10em;
  }

  .summary :global(.vega-embed) {
    width: 20em;
  }

  .info {
    font-size: small;
    text-align: right;
  }
</style>

<div class:loading class="summary">
  {#await summary then s}
    <div class="block">
      <span> <strong>{s.row ? formatValue(s.row.value) : '?'}</strong> per 1,000 </span>
      <span>people</span>
      <span>on {formatDateShort(date)}{#if s.row}<sup>*</sup>{/if}</span>
    </div>
    <div class="block">
      <strong>{s.trend.trend}</strong>
      <span>{formatDelta(s.trend.delta)} compared </span>
      <span>to {formatDateShort(s.trend.refDate)}</span>
    </div>
    <div class="block">
      <span> <strong>{s.max ? formatValue(s.max.value) : '?'}</strong> per 1,000 </span>
      <span>{low ? 'lowest' : 'highest'} value</span>
      <span>on {s.max ? formatDateShort(s.max.date_value) : '?'}</span>
    </div>
  {/await}
  <Vega {spec} {data} signals={{ currentDate: date, maxDate }} />
</div>

{#await summary then s}
  {#if s.row}
    <div class="info">
      <sup>*</sup>based on {formatSampleSize(s.row)} samples with a standard error of {formatStdErr(s.row.stderr)},
      published {formatIssueDate(s.row)}
    </div>
  {/if}
{/await}
