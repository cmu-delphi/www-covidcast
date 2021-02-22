<script>
  import { addMissing, fetchTimeSlice } from '../../data';
  import { findDateRow } from './utils';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
  import { timeWeek } from 'd3-time';
  import SparkLineTooltip from './SparkLineTooltip.svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { currentMode, currentSensor } from '../../stores';
  import { modeByID } from '..';
  import TrendIndicator from './TrendIndicator.svelte';

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
    return fetchTimeSlice(
      sensor,
      region.level,
      region.propertyId,
      startDate,
      date,
      true,
      {
        displayName: region.displayName,
        geo_value: region.propertyId,
      },
      {
        multiValues: false,
      },
    ).then((rows) => addMissing(rows, sensor));
  }

  function findCurrentRow(data, date) {
    return data ? data.then((rows) => findDateRow(date, rows)) : null;
  }

  $: data = loadData(sensor, params);
  $: currentRow = findCurrentRow(data, params.date);
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = generateSparkLine();

  function switchMode() {
    currentSensor.set(sensor.key);
    currentMode.set(modeByID['mobile-indicator']);
  }
</script>

<style>
  .source {
    font-size: 10px;
  }

  .details-link {
    width: 6px;
    display: inline-block;
    fill: currentColor;
  }
</style>

<tr class="has-addon">
  <td>
    <a href="?mode=mobile-indicator&sensor={sensor.key}" class="uk-link-text" on:click|preventDefault={switchMode}>
      {sensor.name}
    </a>
  </td>
  <td class="uk-text-right">
    <TrendIndicator trend={null} />
  </td>
  <td class="uk-text-right">
    {#await currentRow}?{:then row}{row ? sensor.formatValue(row.value) : 'N/A'}{/await}
  </td>
  <td>
    <Vega {spec} {data} tooltip={SparkLineTooltip} tooltipProps={{ sensor }} signals={{ currentDate: params.date }} />
  </td>
  <td>
    <a
      href="?mode=mobile-indicator&sensor={sensor.key}"
      class="uk-link-text details-link"
      on:click|preventDefault={switchMode}>
      {@html chevronRightIcon}
    </a>
  </td>
</tr>
<tr class="addon">
  <td colspan="5" class="source">Source: <strong>{sensor.id}</strong></td>
</tr>
