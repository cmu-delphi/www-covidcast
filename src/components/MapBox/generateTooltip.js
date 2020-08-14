import { timeFormat } from 'd3-time-format';
import { get } from 'svelte/store';
import { signalType, currentSensor, currentSensorEntry, colorScale, currentDateObject } from '../../stores';
import { DIRECTION_THEME, MAP_THEME } from '../../theme';
import { getTextColorBasedOnBackground } from '../../util';

const formatTimeWithoutYear = timeFormat('%B %d');

function generateDirectionTooltip(direction) {
  let color, icon, text;
  if (direction === 1) {
    color = DIRECTION_THEME.increasing;
    icon = DIRECTION_THEME.increasingIcon;
    text = 'Increasing';
  } else if (direction === 0) {
    color = DIRECTION_THEME.steady;
    icon = DIRECTION_THEME.steadyIcon;
    text = 'Steady';
  } else if (direction === -1) {
    color = DIRECTION_THEME.decreasing;
    icon = DIRECTION_THEME.decreasingIcon;
    text = 'Decreasing';
  } else {
    color = MAP_THEME.countyFill;
    icon = '';
    text = 'Estimate Unavailable';
  }

  return `<div class="map-popup-region-value-container">
      <span class="map-popup-region-value"
            style="background-color: ${color};
            color:
            ${getTextColorBasedOnBackground(color)};">
        ${icon} ${text}
      </span>
    </div>`;
}

function coloredBox(value, sensor) {
  const fillColor = get(colorScale)(value);
  const fgColor = getTextColorBasedOnBackground(fillColor);
  return `<span class="map-popup-region-value" style="background-color: ${fillColor}; color: ${fgColor};">
    ${parseFloat(value.toFixed(2)).toLocaleString()}
    ${sensor.format === 'percent' ? '%' : ''}
  </span>`;
}

function generateSignalTooltip(properties) {
  const { value, population } = properties;

  const populationFormatted = population != null ? population.toLocaleString() : 'Unknown';
  const date = formatTimeWithoutYear(get(currentDateObject));
  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  const sens = get(currentSensorEntry);

  // More information displayed
  if (sens.isCasesOrDeath) {
    const avg = properties.avg;
    const count = properties.count;
    return `
      <div class="map-popup-region-value-container">
        Population: ${populationFormatted} <br>
        <u>${sens.yAxis}</u>: <br>
        &emsp; ${date}: ${sens.isCount ? count : count.toFixed(2)} <br>
        &emsp; 7-day avg: ${coloredBox(avg, sens)}
      </div>
    `;
  }
  return `
    <div class="map-popup-region-value-container">
      ${sens.yAxis}: ${coloredBox(value, sens)}
    </div>
  `;
}

export function generateTooltip(feature) {
  const body =
    get(signalType) === 'value'
      ? generateSignalTooltip(feature.properties)
      : generateDirectionTooltip(feature.properties.direction);

  return `<div class="map-popup-region-name">
  ${feature.properties.displayName}
</div>${body}`;
}
