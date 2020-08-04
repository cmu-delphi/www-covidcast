import { timeFormat, timeParse } from 'd3';
import { get } from 'svelte/store';
import {
  currentLevel,
  signalType,
  currentSensor,
  specialCounties,
  currentDate,
  currentSensorEntry,
  colorScale,
} from '../../stores';
import { DIRECTION_THEME, MAP_THEME } from '../../theme';
import { getTextColorBasedOnBackground } from '../../util';
import { levelMegaCounty, dict } from '../../stores/constants';

const parseTime = timeParse('%Y%m%d');
const formatTimeWithoutYear = timeFormat('%B %d');

function getLabelSpecifics(name, state, level) {
  let text = '';
  if (get(currentLevel) === 'county' && level !== levelMegaCounty.id && !specialCounties.includes(name)) {
    text += ' County';
  }
  if (level === 'county') {
    text += ', ' + dict[state];
  }
  return text;
}

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

function generateSignalTooltip(value, value1, Population) {
  const fillColor = get(colorScale)(value);
  const fgColor = getTextColorBasedOnBackground(fillColor);
  const popCommas = Number.parseInt(Population, 10).toLocaleString();
  const date = formatTimeWithoutYear(parseTime(get(currentDate)));
  const sens = get(currentSensorEntry);
  const sensor = get(currentSensor);

  // More information displayed when counts is shown
  if (sensor.match(/incidence_num/)) {
    const avg = value;
    const count = value1;
    // TODO color the average by the color of the current value?
    return `
      <div class="map-popup-region-value-container">
        Population: ${popCommas} <br>
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
        Population: ${popCommas} <br>
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

export function generateTooltip(feature, level) {
  const { value, direction, NAME, STATE, Population, value1 } = feature.properties;

  const title = (level === levelMegaCounty.id ? 'Rest of ' : '') + NAME + getLabelSpecifics(NAME, STATE, level);

  const body =
    get(signalType) === 'value'
      ? generateSignalTooltip(value, value1, Population)
      : generateDirectionTooltip(direction);

  return `<div class="map-popup-region-name">
  ${title}
</div>${body}`;
}
