import { sensorList } from '../../stores';
import descriptions from './descriptions.generated.json';
import { SensorParam } from '../../stores/params';
import { isoParse } from 'd3-time-format';

export const overviewText = descriptions.overview;
export const surveyFullTextLink = descriptions.fullSurveyLink;
export const dataAccessLink = descriptions.dataAccessLink;
export const referenceRawNationSignal = descriptions.referenceRawNationSignal;
export const visibleLevels = descriptions.levels;

/**
 * @typedef {object} Revision
 * @param {number} wave
 * @param {Date} changed
 * @param {string} signal
 * @param {string} signalTooltip
 * @param {string} change
 * @property {import("../../stores/params").SensorParam} sensorParam question as param
 */

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
 * @property {string} learnMoreLink
 * @property {import("../../data").SensorEntry?} sensor matching sensor entry
 * @property {import("../../stores/params").SensorParam} sensorParam question as param
 * @property {Revision[]?} oldRevisions
 */

function toAnchor(value) {
  return value.toLowerCase().replace(/\s/g, '-');
}

/**
 *
 * @param {Revision} revision
 */
function parseRevision(revision) {
  return {
    ...revision,
    changed: isoParse(revision.changed),
  };
}
/**
 * @type {Question[]}
 */
export const questions = descriptions.questions.map((question) => ({
  ...question,
  dataSource: descriptions.dataSource,
  levels: descriptions.levels,
  sensor: sensorList.find((d) => d.id === descriptions.dataSource && d.signal === question.signal),
  anchor: toAnchor(question.name),
  oldRevisions: question.oldRevisions ? question.oldRevisions.map(parseRevision) : null,
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

for (const question of questions) {
  // inject the sensorParam
  question.sensorParam = new SensorParam(
    question.sensor || {
      ...refSensor,
      signal: question.signal,
      key: `${question.dataSource}:${question.signal}`,
      name: question.name,
      isInverted: question.inverted,
    },
  );
  if (question.oldRevisions) {
    question.oldRevisions.forEach((rev) => {
      rev.sensorParam = new SensorParam({
        ...question.sensorParam.value,
        signal: rev.signal,
        key: `${question.sensorParam.key}:${rev.signal}`,
      });
    });
  }
}
