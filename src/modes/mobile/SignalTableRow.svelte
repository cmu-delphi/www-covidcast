<script>
  import { fetchTimeSlice } from '../../data';
  import { findDateRow } from './utils';
  import { currentDateObject } from '../../stores';
  import { primaryValue } from '../../stores/constants';
  import Sparklines from './Sparklines.svelte';

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @type {import("../utils").Params}
   */
  export let params;

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
  $: valueKey = primaryValue(sensor, {});
  $: incidenceKey = primaryValue(sensor, { incidence: true });
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
    <Sparklines {data} {sensor} />
  </td>
</tr>
