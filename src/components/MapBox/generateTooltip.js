import { timeFormat } from 'd3';
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

function generateSignalTooltip(value, value1, population) {
  const fillColor = get(colorScale)(value);
  const fgColor = getTextColorBasedOnBackground(fillColor);
  const populationFormatted = population != null ? population.toLocaleString() : 'Unknown';
  const date = formatTimeWithoutYear(get(currentDateObject));
  const sens = get(currentSensorEntry);
  const sensor = get(currentSensor);

  // More information displayed when counts is shown
  if (sensor.match(/incidence_num/)) {
    const avg = value;
    const count = value1;
    // TODO color the average by the color of the current value?
    return `
      <div class="map-popup-region-value-container">
        Population: ${populationFormatted} <br>
        <u>${sens.yAxis}</u>: <br>
        &emsp; ${date}: ${count} <br>
        &emsp; 7-day avg:
        <span class="map-popup-region-value"
              style="background-color: ${fillColor}; color: ${fgColor};">
          ${parseFloat(avg.toFixed(2)).toLocaleString()}
        </span>

      </div>
    `;
  }
  if (sensor.match(/incidence_prop/)) {
    const avg = value;
    const count = value1;
    return `
      <div class="map-popup-region-value-container">
        Population: ${populationFormatted} <br>
        <u>${sens.yAxis}</u>: <br>
        &emsp; ${date}: ${count.toFixed(2)} <br>
        &emsp; 7-day avg:
        <span class="map-popup-region-value"
              style="background-color: ${fillColor}; color: ${fgColor};">
          ${parseFloat(avg.toFixed(2)).toLocaleString()}
          ${sens.format === 'percent' ? '%' : ''}
        </span>
      </div>
    `;
  }
  return `
    <div class="map-popup-region-value-container">
      ${sens.yAxis}:
      <span class="map-popup-region-value"
            style="background-color: ${fillColor}; color: ${fgColor};">
        ${parseFloat(value.toFixed(2)).toLocaleString()}
        ${sens.format === 'percent' ? '%' : ''}
      </span>
    </div>
  `;
}

export function generateTooltip(feature) {
  const { value, direction, value1, displayName, population } = feature.properties;

  const body =
    get(signalType) === 'value'
      ? generateSignalTooltip(value, value1, population)
      : generateDirectionTooltip(direction);

  return `<div class="map-popup-region-name">
  ${displayName}
</div>${body}`;
}
