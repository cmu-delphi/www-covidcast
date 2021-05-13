import type { RegionLevel } from './regions';

export interface LevelInfo {
  id: RegionLevel;
  label: string;
  labelPlural: string;
  color: string;
}

export const levelList: LevelInfo[] = [
  {
    id: 'nation',
    label: 'United States',
    labelPlural: 'United States',
    color: 'rgb(27, 158, 119)', // use rgb version since it can be parsed for CSS variable manipulation
  },
  {
    id: 'hhs',
    label: 'Dep. of Health & Human Services Regions',
    labelPlural: 'Dep. of Health & Human Services Regions',
    color: 'rgb(217, 95, 2)',
  },
  {
    id: 'state',
    label: 'State',
    labelPlural: 'States',
    color: 'rgb(117, 112, 179)',
  },
  {
    id: 'msa',
    label: 'Metro Area',
    labelPlural: 'Metro Areas',
    color: 'rgb(231, 41, 138)',
  },
  {
    id: 'hrr',
    label: 'Hospital Referral Region',
    labelPlural: 'Hospital Referral Regions',
    color: 'rgb(102, 166, 30)',
  },
  {
    id: 'county',
    label: 'County',
    labelPlural: 'Counties',
    // color: 'rgb(230, 171, 2)',
    color: 'rgb(166, 118, 29)',
  },
];
export const levels: RegionLevel[] = levelList.map((l) => l.id);

export const levelMegaCounty: LevelInfo = {
  id: 'mega-county',
  label: 'Mega County',
  labelPlural: 'Mega Counties',
  color: 'red',
};
export const levelsWithMega = levels.concat(levelMegaCounty.id);

const levelById = new Map<string, LevelInfo>(levelList.map((l) => [l.id, l]));
levelById.set(levelMegaCounty.id, levelMegaCounty);

export function getLevelInfo(level: string): LevelInfo {
  return (
    levelById.get(level) || {
      id: level as RegionLevel,
      label: level.slice(0, 1).toUpperCase() + level.slice(1),
      labelPlural: level.slice(0, 1).toUpperCase() + level.slice(1),
      color: 'black',
    }
  );
}
