<script>
  import { addMissing, fetchTimeSlice } from '../../data';
  import { computeSparklineTimeFrame, findDateRow } from './utils';
  import { generateSparkLine } from '../../specs/lineSpec';
  import Vega from '../../components/Vega.svelte';
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
    const { min, max } = computeSparklineTimeFrame(date, sensor);
    return fetchTimeSlice(
      sensor,
      region.level,
      region.propertyId,
      min,
      max,
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
  $: spec = generateSparkLine({ highlightDate: true });

  function switchMode() {
    currentSensor.set(sensor.key);
    currentMode.set(modeByID.indicator);
  }
</script>

<style>
  .source {
    font-size: 10px;
  }

  .sparkline {
    padding: 4px;
  }

  .sparkline > :global(*) {
    height: 4em;
  }

  .details-link {
    width: 6px;
    display: inline-block;
    fill: currentColor;
  }
</style>

<tr class="has-addon">
  <td>
    <a href="?mode=indicator&sensor={sensor.key}" class="uk-link-text" on:click|preventDefault={switchMode}>
      {sensor.name}
    </a>
  </td>
  <td class="uk-text-right">
    <TrendIndicator trend={null} />
  </td>
  <td class="uk-text-right">
    {#await currentRow}?{:then row}{row ? sensor.formatValue(row.value) : 'N/A'}{/await}
  </td>
  <td rowspan="2" class="sparkline">
    <Vega {spec} {data} tooltip={SparkLineTooltip} tooltipProps={{ sensor }} signals={{ currentDate: params.date }} />
  </td>
  <td>
    <a
      href="?mode=indicator&sensor={sensor.key}"
      class="uk-link-text details-link"
      on:click|preventDefault={switchMode}>
      {@html chevronRightIcon}
    </a>
  </td>
</tr>
<tr class="addon">
  <td colspan="3" class="source">Source: <strong>{sensor.id}</strong></td>
</tr>
