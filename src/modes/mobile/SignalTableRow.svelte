<script>
  import { addMissing, fetchTimeSlice } from '../../data';
  import { findDateRow } from './utils';
  import { currentDateObject } from '../../stores';
  import { formatValue } from '../../formats';

  /**
   * @type {import("../../components/MapBox/colors").SensorEntry}
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
    )
      .then((rows) => addMissing(rows, sensor))
      .then((rows) =>
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
</script>

<style>
  
</style>

<tr>
  <td>{sensor.name}</td>
  <td class="uk-text-right">
    {#await currentRow}?{:then row}{row ? formatValue(row.value) : 'N/A'}{/await}
  </td>
  <td class="uk-text-right">
    {#await currentRow}?{:then row}{row ? formatValue(row.value) : 'N/A'}{/await}
  <td>
    TODO
  </td>
</tr>
