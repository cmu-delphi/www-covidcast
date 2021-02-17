<script>
  import { addMissing, fetchTimeSlice } from '../../data';
  import { findDateRow, guessSensorColor } from './utils';
  import { primaryValue } from '../../stores/constants';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
  import { timeWeek } from 'd3-time';
  import SparkLineTooltip from './SparkLineTooltip.svelte';
  import plusCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/plus-circle.svg';
  import { currentMode, currentSensor } from '../../stores';
  import { modeByID } from '..';

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
    const startDate = timeWeek.offset(date, -4);
    return fetchTimeSlice(sensor, region.level, region.propertyId, startDate, date, true, {
      displayName: region.displayName,
      geo_value: region.propertyId,
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

  function switchMode() {
    currentSensor.set(sensor.key);
    currentMode.set(modeByID['mobile-indicator']);
  }
</script>

<tr>
  <td>
    <a href="?mode=mobile-indicator&sensor={sensor.key}" class="uk-link-text" on:click|preventDefault={switchMode}>
      <span class="inline-svg-icon">
        {@html plusCircleIcon}
      </span>
      {sensor.name}
    </a>
  </td>
  <td class="uk-text-right">TODO</td>
  <td class="uk-text-right">
    {#await currentRow}?{:then row}{row ? sensor.formatValue(row[valueKey]) : 'N/A'}{/await}
  </td>
  <td>
    <Vega {spec} {data} tooltip={SparkLineTooltip} tooltipProps={{ sensor }} signals={{ currentDate: params.date }} />
  </td>
</tr>
