<script>
  import { fetchTimeSlice } from '../../data';
  import { aggregateByWeek, findDateRow } from './utils';
  import { currentDateObject } from '../../stores';
  import { primaryValue } from '../../stores/constants';
  import Heatmap1D from './Heatmap1D.svelte';
  import { timeFormat } from 'd3-time-format';
  import Sparklines from './Sparklines.svelte';

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @type {import("../utils").Params}
   */
  export let params;

  export let sparklines = false;

  function loadData(sensor, params) {
    const { region, startDay, endDay } = params;
    if (!region || !startDay || !endDay) {
      return null;
    }
    return fetchTimeSlice(
      sensor,
      params.region.level,
      params.region.propertyId,
      params.startDay,
      params.endDay,
      false,
      {
        geo_value: params.region.propertyId,
      },
    ).then((rows) =>
      rows.map((row) => {
        row.displayName = params.region.displayName;
        return row;
      }),
    );
  }

  function findCurrentRow(data, date) {
    return data ? data.then((rows) => findDateRow(date, rows)) : null;
  }

  $: data = loadData(sensor, params);
  $: currentRow = findCurrentRow(data, $currentDateObject);
  $: byWeek = data ? data.then((rows) => aggregateByWeek(rows, sensor, params.startDay, params.endDay)) : null;

  $: valueKey = primaryValue(sensor, {});
  $: incidenceKey = primaryValue(sensor, { incidence: true });

  const weekFormatter = timeFormat('%Y %V');
</script>

<style>
</style>

<tr>
  <td>{sensor.name}</td>
  <td class="uk-text-right">
    {#await currentRow}?{:then row}{row ? sensor.formatValue(row[valueKey]) : 'N/A'}{/await}
  </td>
  <td class="uk-text-right">
    {#if sensor.isCasesOrDeath}
      {#await currentRow}?{:then row}{row ? sensor.formatValue(row[incidenceKey]) : 'N/A'}{/await}
    {/if}
  </td>
  <td>
    {#if sparklines}
      <Sparklines {data} {sensor} />
    {:else}
      <Heatmap1D data={byWeek} {sensor} level={params.region.level} dateFormatter={weekFormatter} />
    {/if}
  </td>
</tr>
