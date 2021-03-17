import { ensureSensorStructure, sensorList } from './constants';
import descriptions from './questions.generated.json';
import { SensorParam } from './params';
import { isoParse } from 'd3-time-format';

export const overviewText = descriptions.overview;
export const surveyFullTextLink = descriptions.fullSurveyLink;
export const dataAccessLink = descriptions.dataAccessLink;
export const referenceRawNationSignal = descriptions.referenceRawNationSignal;
export const visibleLevels = descriptions.levels;

export function waveLink(wave) {
  return `https://cmu-delphi.github.io/delphi-epidata/symptom-survey/coding.html#wave-${wave}`;
}

/**
 * @typedef {object} Wave
 * @property {string} name
 * @property {number} wave
 * @property {Date} published
 * @property {string} link
 * @property {Wave?} next
 * @property {Wave?} previous
 */

/**
 * @type {Wave[]}
 */
export const waves = descriptions.waves.reduce((waves, wave, i) => {
  const date = isoParse(wave);
  const waveObj = {
    name: `Wave ${i + 1}`,
    wave: i + 1,
    published: date,
    previous: waves[i - 1],
    link: waveLink(i + 1),
  };
  if (waveObj.previous) {
    waveObj.previous.next = waveObj;
  }
  waves.push(waveObj);
  return waves;
}, []);

/**
 * @typedef {object} Revision
 * @property {string} change
 * @property {Wave} changedInWave
 * @property {Wave} addedInWave
 * @property {string} signal
 * @property {import("../../stores/params").Sensor} sensor matching sensor
 * @property {import("../../stores/params").SensorParam} sensorParam question as param
 */

/**
 * @typedef {object} Question
 * @property {string} category
 * @property {string} anchor
 * @property {string} question HTML
 * @property {string} learnMoreLink
 * @property {Wave} addedInWave
 * @property {Revision[]?} oldRevisions
 *
 * @property {string} name
 * @property {string} signal
 * @property {import("../../stores/params").Sensor} sensor matching sensor
 * @property {import("../../stores/params").SensorParam} sensorParam matching sensor param
 */

function toAnchor(value) {
  return value.toLowerCase().replace(/\s/g, '-');
}

function parseRevisions(revisions, latestAddedInWave) {
  if (!revisions) {
    return null;
  }
  // revision are reversed in time so temporary revert the order
  return revisions
    .slice()
    .reverse()
    .reduce((acc, v) => {
      acc.push({
        ...v,
        changedInWave: acc.length === 0 ? waves[latestAddedInWave - 1] : acc[acc.length - 1].addedInWave,
        addedInWave: waves[v.addedInWave - 1],
      });
      return acc;
    }, [])
    .reverse();
}
/**
 * @type {Question[]}
 */
export const questions = descriptions.questions.map((question) => ({
  ...question,
  sensor: sensorList.find((d) => d.id === descriptions.id && d.signal === question.signal),
  anchor: toAnchor(question.name),
  addedInWave: waves[question.addedInWave - 1],
  oldRevisions: parseRevisions(question.oldRevisions, question.addedInWave),
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

/**
 * @param {Question} question
 */
function deriveSensor(question) {
  return ensureSensorStructure({
    id: descriptions.id,
    rawSignal: descriptions.rawSignal,
    type: descriptions.type,
    levels: descriptions.levels,
    xAxis: descriptions.xAxis,
    yAxis: descriptions.yAxis,
    format: descriptions.format,
    unit: descriptions.unit,
    isInverted: descriptions.isInverted,
    is7DayAverage: descriptions.is7DayAverage,
    hasStdErr: descriptions.hasStdErr,
    credits: descriptions.credits,
    links: [
      `<a href="https://covidcast.cmu.edu/surveys.html">More information</a>`,
      ...(descriptions.links || [])
    ],
    ...question,
  });
}

/**
 * @param {import('./constants').Sensor} sensor
 * @param {Revision} rev
 */
function deriveRevisionSensor(sensor, rev) {
  return ensureSensorStructure({
    ...sensor,
    signal: rev.signal,
    rawSignal: rev.rawSignal,
  });
}

for (const question of questions) {
  // inject the sensorParam  
  question.sensor = question.sensor || deriveSensor(question);
  question.sensorParam = new SensorParam(question.sensor);
  if (question.oldRevisions) {
    question.oldRevisions.forEach((rev) => {
      rev.sensor = deriveRevisionSensor(question.sensor, rev);
      rev.sensorParam = new SensorParam(rev.sensor);
    });
  }
}