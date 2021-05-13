import type { RegionLevel } from './regions';

export interface LevelInfo {
  id: RegionLevel;
  label: string;
  labelPlural: string;
}

export const levelList: LevelInfo[] = [
  {
    id: 'nation',
    label: 'United States',
    labelPlural: 'United States',
  },
  {
    id: 'hhs',
    label: 'Dep. of Health & Human Services Regions',
    labelPlural: 'Dep. of Health & Human Services Regions',
  },
  {
    id: 'state',
    label: 'State',
    labelPlural: 'States',
  },
  {
    id: 'msa',
    label: 'Metro Area',
    labelPlural: 'Metro Areas',
  },
  {
    id: 'hrr',
    label: 'Hospital Referral Region',
    labelPlural: 'Hospital Referral Regions',
  },
  {
    id: 'county',
    label: 'County',
    labelPlural: 'Counties',
  },
];
export const levels: RegionLevel[] = levelList.map((l) => l.id);

export const levelMegaCounty: LevelInfo = {
  id: 'mega-county',
  label: 'Mega County',
  labelPlural: 'Mega Counties',
};
export const levelsWithMega = levels.concat(levelMegaCounty.id);

const levelById = new Map<string, LevelInfo>(levelList.map((l) => [l.id, l]));

export function getLevelInfo(level: string): LevelInfo {
  return (
    levelById.get(level) || {
      id: level as RegionLevel,
      label: level.slice(0, 1).toUpperCase() + level.slice(1),
      labelPlural: level.slice(0, 1).toUpperCase() + level.slice(1),
    }
  );
}
