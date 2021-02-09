<script>
  import { formatDateShort } from '../../formats';
  import { currentDateObject } from '../../stores';
  import { formatAPITime } from '../../data';
  import ChangeIndicator from './ChangeIndicator.svelte';

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow}
   */
  export let item;

  /**
   * @type {View}
   */
  export let view;

  $: items = item && view ? view.data('values').filter((d) => d.time_value === item.time_value) : [];

  $: currentDateNum = Number.parseInt(formatAPITime($currentDateObject), 10);
  $: currentDateItem = view ? view.data('values').find((d) => d.time_value === currentDateNum) : null;
</script>

<style>
  .hidden {
    display: none;
  }

  th,
  td {
    border: none;
    padding-left: 1em;
    padding-right: 0.5em;
  }

  .right {
    text-align: right;
  }

  .area {
    text-align: right;
  }

  h5 {
    margin: 0;
    padding: 0;
  }
</style>

<div aria-label="tooltip" class="tooltip" class:hidden>
  <h5>
    {#if item.displayName}{item.displayName} on {formatDateShort(item.date_value)}{/if}
  </h5>
  <table>
    <tbody>
      {#if sensor.isCasesOrDeath}
        <tr>
          <th>{sensor.yAxis}</th>
          <th class="area">Count</th>
          <th class="area">Count / 100K</th>
        </tr>
        <tr>
          <th>{formatDateShort(item.date_value)}</th>
          <td class="right">
            <ChangeIndicator prop="count" {sensor} {item} {currentDateItem} />
            {sensor.formatValue(item.count)}
          </td>
          <td class="right">
            <ChangeIndicator prop="countRatio" {sensor} {item} {currentDateItem} />
            {sensor.formatValue(item.countRatio)}
          </td>
        </tr>
        <tr>
          <th>7-day average</th>
          <td class="right">
            <ChangeIndicator prop="avg" {sensor} {item} {currentDateItem} />
            {sensor.formatValue(item.avg)}
          </td>
          <td class="right">
            <ChangeIndicator prop="avgRatio" {sensor} {item} {currentDateItem} />
            {sensor.formatValue(item.avgRatio)}
          </td>
        </tr>
        <tr>
          <th>Cumulative up to<br />{formatDateShort(item.date_value)}</th>
          <td class="right">
            <ChangeIndicator prop="countCumulative" {sensor} {item} {currentDateItem} />
            {sensor.formatValue(item.countCumulative)}
          </td>
          <td class="right">
            <ChangeIndicator prop="countRatioCumulative" {sensor} {item} {currentDateItem} />
            {sensor.formatValue(item.countRatioCumulative)}
          </td>
        </tr>
      {:else}
        <tr>
          <th>{sensor.yAxis}</th>
          <td class="right">
            <ChangeIndicator prop="value" {sensor} {item} {currentDateItem} />
            {sensor.formatValue(item.value)}
          </td>
        </tr>
        {#if sensor.hasStdErr && item.stderr != null}
          <tr>
            <th>Standard Error</th>
            <td class="right">{sensor.formatValue(item.stderr)}</td>
          </tr>
        {/if}
      {/if}
    </tbody>
  </table>
</div>
