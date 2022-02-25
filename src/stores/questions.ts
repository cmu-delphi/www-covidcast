import descriptions from './questions.generated.json';
import { isoParse } from 'd3-time-format';
import type { RegionLevel } from '../data/regions';
import type { SensorLike } from '../data/sensor';

export const overviewText = descriptions.overview;
export const surveyFullTextLink = descriptions.fullSurveyLink;
export const dataAccessLink = descriptions.dataAccessLink;
export const referenceRawNationSensorLike: SensorLike = {
  id: descriptions.id,
  signal: descriptions.referenceRawNationSignal,
};
export const visibleLevels = descriptions.levels as RegionLevel[];

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

function getWave(wave: number): Wave {
  if (wave >= waves.length) {
    // create dummy waves
    for (let i = waves.length; i <= wave; i++) {
      console.warn(`faking wave ${i + 1}, please update the google doc`);
      const waveObj: Wave = {
        name: `Wave ${i + 1}`,
        wave: i + 1,
        published: new Date(),
        previous: waves[i - 1],
        link: waveLink(i + 1),
      };
      if (waveObj.previous) {
        waveObj.previous.next = waveObj;
      }
      waves.push(waveObj);
    }
  }
  return wave < 0 ? waves[0] : waves[wave];
}

export interface Revision extends SensorLike {
  change: string;
  changedInWave: Wave;
  addedInWave: Wave;
}

export interface Question extends SensorLike {
  category: string;
  anchor: string;
  /**
   * HTML
   */
  question: string;
  addedInWave: Wave;
  oldRevisions?: Revision[];

  name: string;
  unit?: string;
}

function toAnchor(value: string) {
  return value.toLowerCase().replace(/\s/g, '-');
}

export const questions: Question[] = descriptions.questions.map((desc) => {
  const q: Question = {
    ...desc,
    id: descriptions.id,
    anchor: toAnchor(desc.name),
    addedInWave: getWave(desc.addedInWave - 1),
    oldRevisions: undefined,
  };
  if (desc.oldRevisions) {
    // revision are reversed in time so temporary revert the order
    q.oldRevisions = desc.oldRevisions
      .slice()
      .reverse()
      .reduce((acc, rev) => {
        acc.push({
          ...rev,
          id: descriptions.id,
          changedInWave: acc.length === 0 ? getWave(desc.addedInWave - 1) : acc[acc.length - 1].addedInWave,
          addedInWave: getWave(rev.addedInWave - 1),
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

export function groupByQuestionCategory(questions: readonly Question[]): QuestionCategory[] {
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
}
