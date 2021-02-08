<script>
  import { addMissing, fetchTimeSlice } from '../../data';
  import { findDateRow, guessSensorColor } from './utils';
  import { primaryValue } from '../../stores/constants';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
  import { timeWeek } from 'd3-time';
  import SparkLineTooltip from './SparkLineTooltip.svelte';

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  function loadData(sensor, params) {
    const { region, date } = params;
    if (!region || !date) {
      return null;
    }
    const startDate = timeWeek.offset(params.date, -4);
    return fetchTimeSlice(sensor, params.region.level, params.region.propertyId, startDate, date, true, {
      displayName: params.region.displayName,
      geo_value: params.region.propertyId,
    }).then((rows) => addMissing(rows, sensor));
  }

  function findCurrentRow(data, date) {
    return data ? data.then((rows) => findDateRow(date, rows)) : null;
  }

  $: data = loadData(sensor, params);
  $: currentRow = findCurrentRow(data, params.date);
  $: valueKey = primaryValue(sensor, {});
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = generateSparkLine({ valueField: valueKey, color: guessSensorColor(sensor) });
</script>

<style>
</style>

<tr>
  <td>{sensor.name}</td>
  <td class="uk-text-right">TODO</td>
  <td class="uk-text-right">
    {#await currentRow}?{:then row}{row ? sensor.formatValue(row[valueKey]) : 'N/A'}{/await}
  </td>
  <td>
    <Vega {spec} {data} tooltip={SparkLineTooltip} tooltipProps={{ sensor }} />
  </td>
</tr>
