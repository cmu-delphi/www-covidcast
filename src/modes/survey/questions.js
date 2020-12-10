import { sensorList } from '../../stores';
import descriptions from './descriptions.generated.json';

export const overviewText = descriptions.overview;

/**
 * @typedef {object} Question
 * @property {string} anchor
 * @property {string} dataSource
 * @property {string} signal
 * @property {string} signalName
 * @property {string} signalTooltip
 * @property {string} name
 * @property {string} question HTML
 * @property {boolean} inverted
 * @property {string[]} levels
 * @property {string} signal
 * @property {string} learnMoreLink
 * @property {import("../../data").SensorEntry?} sensor matching sensor entry
 */

/**
 * @type {Question[]}
 */
export const questions = descriptions.questions.map((question) => ({
  ...question,
  dataSource: descriptions.dataSource,
  levels: descriptions.levels,
  sensor: sensorList.find((d) => d.id === descriptions.dataSource && d.signal === question.signal),
  anchor: question.name.toLowerCase().replace(/\s/g, '-'),
}));

export const refSensor = questions.some((d) => d.sensor != null)
  ? questions.find((d) => d.sensor != null).sensor
  : sensorList.find((d) => d.id === 'fb-survey');
