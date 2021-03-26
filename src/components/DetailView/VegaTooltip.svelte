<script>
  import { formatDateShort } from '../../formats';
  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  export let hidden = false;
  /**
   * @type {import('../../data').EpiDataRow}
   */
  export let item;
</script>

<div aria-label="tooltip" class="tooltip" class:hidden>
  <h5>
    {#if item.displayName}{item.displayName} on{/if}
    {formatDateShort(item.date_value)}
  </h5>
  <table>
    <tbody>
      {#if sensor.isCasesOrDeath}
        <tr>
          <th>{sensor.yAxis}</th>
          <th class="area">Count</th>
          <th class="area">Ratios (per 100,000)</th>
        </tr>
        <tr>
          <th>{formatDateShort(item.date_value)}</th>
          <td class="right">{sensor.formatValue(item.count)}</td>
          <td class="right">{sensor.formatValue(item.countRatio)}</td>
        </tr>
        <tr>
          <th>7-day average</th>
          <td class="right">{sensor.formatValue(item.avg)}</td>
          <td class="right">{sensor.formatValue(item.avgRatio)}</td>
        </tr>
        <tr>
          <th>{formatDateShort(item.date_value)} (cumulative)</th>
          <td class="right">{sensor.formatValue(item.countCumulative)}</td>
          <td class="right">{sensor.formatValue(item.countRatioCumulative)}</td>
        </tr>
      {:else}
        <tr>
          <th>{sensor.yAxis}</th>
          <td class="right">{sensor.formatValue(item.value)}</td>
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

<style>
  .hidden {
    display: none;
  }

  th,
  td {
    border: none;
  }

  .right {
    text-align: right;
  }

  .area {
    text-align: center;
  }

  h5 {
    margin: 0;
    padding: 0;
  }
</style>
