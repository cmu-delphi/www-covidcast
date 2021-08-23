<script>
  import { formatDateISO, formatFraction, formatRawValue, formatValue, formatWeek } from '../../formats';

  export let hidden = false;
  /**
   * @type {import('../../data/indicatorInfo').ProfileEntry}
   */
  export let item;
  /**
   * @type {{date_field: string, date_label: string, value_field: string, value_label: string}}
   */
  export let options;

  /**
   * @type {import('../../stores/params').SensorParam}
   */
  export let sensor;
</script>

<div aria-label="tooltip" class="tooltip" class:hidden>
  <h5>
    Lag {item.lag} / {sensor && sensor.isWeeklySignal
      ? formatWeek(item[options.dateField])
      : formatDateISO(item[options.dateField])}
  </h5>
  <table>
    <tr>
      <th>Value</th>
      <td>{formatRawValue(item.value)}</td>
    </tr>
    {#if options.isRelative}
      <tr>
        <th>{options.valueLabel}</th>
        <td>{formatFraction(item[options.valueField])}</td>
      </tr>
    {:else}
      <tr>
        <th>{options.valueLabel}</th>
        <td>{formatValue(item[options.valueField])}</td>
      </tr>
    {/if}
  </table>
</div>

<style>
  .hidden {
    display: none;
  }

  h5 {
    margin: 0;
    padding: 0;
  }

  th {
    text-align: left;
  }
  td {
    text-align: right;
  }
</style>
