import { sensorList } from '../../stores';
import descriptions from './descriptions.generated.json';

export const overviewText = descriptions.overview;

export const factor = 10;
export const unit = 'people';
export const unitLong = 'People per every 1,000 people';

/**
 * @typedef {object} Question
 * @property {string} category
 * @property {string} anchor
 * @property {string} dataSource
 * @property {string} signal
 * @property {string} signalTooltip
 * @property {string} name
 * @property {string} question HTML
 * @property {boolean} inverted
 * @property {string[]} levels
 * @property {string} signal
 * @property {string} learnMoreLink
 * @property {import("../../data").SensorEntry?} sensor matching sensor entry
 */

function toAnchor(value) {
  return value.toLowerCase().replace(/\s/g, '-');
}

/**
 * @type {Question[]}
 */
const questions = descriptions.questions.map((question) => ({
  ...question,
  dataSource: descriptions.dataSource,
  levels: descriptions.levels,
  sensor: sensorList.find((d) => d.id === descriptions.dataSource && d.signal === question.signal),
  anchor: toAnchor(question.name),
}));

/**
 * @type ({name: string, anchor: string, questions: Question[]}[])
 */
export const questionCategories = (() => {
  const cats = [];
  for (const question of questions) {
    if (cats.length === 0 || cats[cats.length - 1].name !== question.category) {
      cats.push({
        name: question.category,
        anchor: toAnchor(question.category),
        questions: [],
      });
    }
    cats[cats.length - 1].questions.push(question);
  }
  return cats;
})();

export const refSensor = questions.some((d) => d.sensor != null)
  ? questions.find((d) => d.sensor != null).sensor
  : sensorList.find((d) => d.id === 'fb-survey');
