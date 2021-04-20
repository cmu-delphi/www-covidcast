import { ensureSensorStructure, Sensor, sensorList } from './constants';
import descriptions from './questions.generated.json';
import { SensorParam } from './params';
import { isoParse } from 'd3-time-format';
import type { RegionLevel } from '../maps';

export const overviewText = descriptions.overview;
export const surveyFullTextLink = descriptions.fullSurveyLink;
export const dataAccessLink = descriptions.dataAccessLink;
export const referenceRawNationSignal = descriptions.referenceRawNationSignal;
export const visibleLevels = descriptions.levels;

export function waveLink(wave: number): string {
  return `https://cmu-delphi.github.io/delphi-epidata/symptom-survey/coding.html#wave-${wave}`;
}

export interface Wave {
  name: string;
  wave: number;
  published: Date;
  link: string;
  next?: Wave;
  previous?: Wave;
}
export const waves = descriptions.waves.reduce((waves, wave, i) => {
  const date = isoParse(wave)!;
  const waveObj: Wave = {
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
}, [] as Wave[]);

export interface Revision {
  change: string;
  changedInWave: Wave;
  addedInWave: Wave;
  signal: string;
  /**
   * matching sensor
   */
  sensor: Sensor;
  /**
   * question as param
   */
  sensorParam: SensorParam;
}

export interface Question {
  category: string;
  anchor: string;
  /**
   * HTML
   */
  question: string;
  learnMoreLink: string;
  addedInWave: Wave;
  oldRevisions?: Revision[];

  name: string;
  signal: string;
  sensor: Sensor;
  sensorParam: SensorParam;
}

function toAnchor(value: string) {
  return value.toLowerCase().replace(/\s/g, '-');
}

function deriveSensor(question: { signal: string; name: string }) {
  return ensureSensorStructure({
    id: descriptions.id,
    rawSignal: (descriptions.rawSignal ?? undefined) as string | undefined,
    type: descriptions.type as Sensor['type'],
    levels: descriptions.levels as RegionLevel[],
    xAxis: descriptions.xAxis,
    yAxis: descriptions.yAxis,
    format: descriptions.format as Sensor['format'],
    unit: descriptions.unit,
    highValuesAre:
      (descriptions as { highValuesAre?: Sensor['highValuesAre'] }).highValuesAre ??
      (descriptions.isInverted === true ? 'good' : 'bad'),
    is7DayAverage: descriptions.is7DayAverage,
    hasStdErr: descriptions.hasStdErr,
    credits: descriptions.credits,
    links: [`<a href="https://covidcast.cmu.edu/surveys.html">More information</a>`, ...(descriptions.links || [])],
    ...question,
  });
}

export const questions: Question[] = descriptions.questions.map((desc) => {
  const sensor = sensorList.find((d) => d.id === descriptions.id && d.signal === desc.signal) ?? deriveSensor(desc);
  const q: Question = {
    ...desc,
    sensor,
    sensorParam: new SensorParam(sensor),
    anchor: toAnchor(desc.name),
    addedInWave: waves[desc.addedInWave - 1],
    oldRevisions: undefined,
  };
  if (desc.oldRevisions) {
    // revision are reversed in time so temporary revert the order
    q.oldRevisions = desc.oldRevisions
      .slice()
      .reverse()
      .reduce((acc, rev) => {
        const revSensor = ensureSensorStructure({
          ...sensor,
          key: `${sensor.id}:${rev.signal}`,
          signal: rev.signal,
          rawSignal: undefined, // TODO rev rawSignal
        });
        acc.push({
          ...rev,
          sensor: revSensor,
          sensorParam: new SensorParam(revSensor),
          changedInWave: acc.length === 0 ? waves[desc.addedInWave - 1] : acc[acc.length - 1].addedInWave,
          addedInWave: waves[rev.addedInWave - 1],
        });
        return acc;
      }, [] as Revision[])
      .reverse();
  }
  return q;
});

export interface QuestionCategory {
  name: string;
  anchor: string;
  questions: Question[];
}

/**
 * @type ({name: string, anchor: string, questions: Question[]}[])
 */
export const questionCategories = (() => {
  const cats: QuestionCategory[] = [];
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
  ? questions.find((d) => d.sensor != null)!.sensor
  : sensorList.find((d) => d.id === 'fb-survey');
