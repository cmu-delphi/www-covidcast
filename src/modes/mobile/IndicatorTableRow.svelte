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
  .sensor-name {
    display: block;
  }

  .source {
    font-size: 10px;
  }
</style>

<tr>
  <td>
    <a
      href="?mode=mobile-indicator&sensor={sensor.key}"
      class="uk-link-text sensor-name"
      on:click|preventDefault={switchMode}>
      {sensor.name}
    </a>
    <span class="source">Source: <strong>{sensor.id}</strong></span>
  </td>
  <td class="uk-text-right">TODO</td>
  <td class="uk-text-right">
    {#await currentRow}?{:then row}{row ? sensor.formatValue(row.value) : 'N/A'}{/await}
  </td>
  <td>
    <Vega {spec} {data} tooltip={SparkLineTooltip} tooltipProps={{ sensor }} signals={{ currentDate: params.date }} />
  </td>
  <td>
    <a href="?mode=mobile-indicator&sensor={sensor.key}" class="uk-link-text" on:click|preventDefault={switchMode}>
      <span class="inline-svg-icon">
        {@html chevronRightIcon}
      </span>
    </a>
  </td>
</tr>
