<script>
  import { formatDateShort, formatPopulation } from '../../formats';
  import { currentSensorEntry, colorScale, currentDateObject, signalCasesOrDeathOptions } from '../../stores';
  import { ZERO_COLOR } from '../../theme';
  import { getTextColorBasedOnBackground } from '../../util';

  export let invalid = false;
  export let properties;
  $: value = properties ? properties.value : 0;

  $: options = $signalCasesOrDeathOptions;

  /**
   * @param {number} value
   */
  function colorScaleStyle(value) {
    const color = value === 0 ? ZERO_COLOR : $colorScale(value);
    return `background-color: ${color}; color: ${getTextColorBasedOnBackground(color)}`;
  }
</script>

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
          <td class="right">{formatPopulation(properties)}</td>
        </tr>
        {#if $currentSensorEntry.isCasesOrDeath}
          <tr>
            <th>{$currentSensorEntry.yAxis}</th>
            <th class="area">Count</th>
            <th class="area">Ratios (per 100,000)</th>
          </tr>
          <tr>
            <th>{formatDateShort($currentDateObject)}</th>
            <td class="right" style={!options.cumulative && options.incidence ? colorScaleStyle(properties.count) : ''}>
              {$currentSensorEntry.formatValue(properties.count)}
            </td>
            <td
              class="right"
              style={!options.cumulative && !options.incidence ? colorScaleStyle(properties.countRatio) : ''}
            >
              {$currentSensorEntry.formatValue(properties.countRatio)}
            </td>
          </tr>
          <tr>
            <th>7-day avg</th>
            <td class="right" style={!options.cumulative && options.incidence ? colorScaleStyle(properties.avg) : ''}>
              {$currentSensorEntry.formatValue(properties.avg)}
            </td>
            <td
              class="right"
              style={!options.cumulative && !options.incidence ? colorScaleStyle(properties.avgRatio) : ''}
            >
              {$currentSensorEntry.formatValue(properties.avgRatio)}
            </td>
          </tr>
          <tr>
            <th>Cumulative {formatDateShort($currentDateObject)}</th>
            <td
              class="right"
              style={options.cumulative && options.incidence ? colorScaleStyle(properties.countCumulative) : ''}
            >
              {$currentSensorEntry.formatValue(properties.countCumulative)}
            </td>
            <td
              class="right"
              style={options.cumulative && !options.incidence ? colorScaleStyle(properties.countRatioCumulative) : ''}
            >
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
