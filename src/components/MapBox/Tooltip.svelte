<script>
  import { timeFormat } from 'd3-time-format';
  import { signalType, currentSensorEntry, colorScale, currentDateObject, signalShowCumulative } from '../../stores';
  import { DIRECTION_THEME } from '../../theme';
  import { getTextColorBasedOnBackground } from '../../util';

  export let invalid = false;
  export let properties;
  $: value = properties ? properties.value : 0;

  const formatTimeWithoutYear = timeFormat('%B %d');

  /**
   * @param {number} value
   */
  function colorScaleStyle(value) {
    const color = $colorScale(value);
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
        {#if $signalType === 'direction'}
          <tr>
            {#if properties.value === 1}
              <td colspan="2" style="background-color: {DIRECTION_THEME.increasing}">
                {@html DIRECTION_THEME.increasingIcon}
                Increasing
              </td>
            {:else if value === 0}
              <td colspan="2" style="background-color: {DIRECTION_THEME.steady}">
                {@html DIRECTION_THEME.steadyIcon}
                Steady
              </td>
            {:else if value === -1}
              <td colspan="2" style="background-color: {DIRECTION_THEME.decreasing}">
                {@html DIRECTION_THEME.decreasingIcon}
                Decreasing
              </td>
            {:else}
              <td colspan="2">Unknown</td>
            {/if}
          </tr>
        {:else if $currentSensorEntry.isCasesOrDeath}
          <tr>
            <th colspan="2" class="area">{$currentSensorEntry.yAxis}</th>
          </tr>
          <tr>
            <th>{formatTimeWithoutYear($currentDateObject)}</th>
            <td class="right" style={$signalShowCumulative ? '' : colorScaleStyle(properties.count)}>
              {$currentSensorEntry.formatValue(properties.count)}
            </td>
          </tr>
          <tr>
            <th>7-day avg</th>
            <td class="right" style={$signalShowCumulative ? '' : colorScaleStyle(properties.avg)}>
              {$currentSensorEntry.formatValue(properties.avg)}
            </td>
          </tr>
          <tr>
            <th>{formatTimeWithoutYear($currentDateObject)} (cumulated)</th>
            <td class="right" style={$signalShowCumulative ? colorScaleStyle(properties.countCumulative) : ''}>
              {$currentSensorEntry.formatValue(properties.countCumulative)}
            </td>
          </tr>
          <tr>
            <th>7-day avg (cumulated)</th>
            <td class="right" style={$signalShowCumulative ? colorScaleStyle(properties.avgCumulative) : ''}>
              {$currentSensorEntry.formatValue(properties.avgCumulative)}
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
