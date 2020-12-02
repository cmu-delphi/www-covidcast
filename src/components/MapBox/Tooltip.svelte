<script>
  import { timeFormat } from 'd3-time-format';
  import { currentSensorEntry, colorScale, currentDateObject, signalCasesOrDeathOptions } from '../../stores';
  import { ZERO_COLOR } from '../../theme';
  import { getTextColorBasedOnBackground } from '../../util';

  export let invalid = false;
  export let properties;
  $: value = properties ? properties.value : 0;

  $: options = $signalCasesOrDeathOptions;

  const formatTimeWithoutYear = timeFormat('%B %d');

  /**
   * @param {number} value
   */
  function colorScaleStyle(value) {
    const color = value === 0 ? ZERO_COLOR : $colorScale(value);
    return `background-color: ${color}; color: ${getTextColorBasedOnBackground(color)}`;
  }
</script>

<style>
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
    text-align: center;
  }

  table {
    margin: 0;
  }

  .tooltip {
    pointer-events: none;
  }
</style>

<div aria-label="tooltip" class="tooltip">
  {#if !properties}
    <h5>Estimate unavailable</h5>
  {:else if invalid}
    <h5>Estimate unavailable for rest of {properties.displayName}</h5>
  {:else}
    <h5>{properties.displayName}</h5>
    <table>
      <tbody>
        <tr>
          <th>Population</th>
          <td class="right">
            {typeof properties.population == 'number' ? properties.population.toLocaleString() : 'Unknown'}
          </td>
        </tr>
        {#if $currentSensorEntry.isCasesOrDeath}
          <tr>
            <th>{$currentSensorEntry.yAxis}</th>
            <th class="area">Count</th>
            <th class="area">Ratios (per 100,000)</th>
          </tr>
          <tr>
            <th>{formatTimeWithoutYear($currentDateObject)}</th>
            <td class="right" style={!options.cumulative && !options.ratio ? colorScaleStyle(properties.count) : ''}>
              {$currentSensorEntry.formatValue(properties.count)}
            </td>
            <td
              class="right"
              style={!options.cumulative && options.ratio ? colorScaleStyle(properties.countRatio) : ''}>
              {$currentSensorEntry.formatValue(properties.countRatio)}
            </td>
          </tr>
          <tr>
            <th>7-day avg</th>
            <td class="right" style={!options.cumulative && !options.ratio ? colorScaleStyle(properties.avg) : ''}>
              {$currentSensorEntry.formatValue(properties.avg)}
            </td>
            <td class="right" style={!options.cumulative && options.ratio ? colorScaleStyle(properties.avgRatio) : ''}>
              {$currentSensorEntry.formatValue(properties.avgRatio)}
            </td>
          </tr>
          <tr>
            <th>Cumulative {formatTimeWithoutYear($currentDateObject)}</th>
            <td
              class="right"
              style={options.cumulative && !options.ratio ? colorScaleStyle(properties.countCumulative) : ''}>
              {$currentSensorEntry.formatValue(properties.countCumulative)}
            </td>
            <td
              class="right"
              style={options.cumulative && options.ratio ? colorScaleStyle(properties.countRatioCumulative) : ''}>
              {$currentSensorEntry.formatValue(properties.countRatioCumulative)}
            </td>
          </tr>
        {:else}
          <tr>
            <th>{$currentSensorEntry.yAxis}</th>
            <td class="right" style={colorScaleStyle(value)}>{$currentSensorEntry.formatValue(value)}</td>
          </tr>
        {/if}
      </tbody>
    </table>
  {/if}
</div>
