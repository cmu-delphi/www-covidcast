import { dsvFormat } from 'd3-dsv';
import stateRaw from './processed/state.csv.js';
import msaRaw from './processed/msa.csv.js';
import countyRaw from './processed/county.csv.js';
import hrrRaw from './processed/hrr.csv.js';
import type { CountyInfo, HRRInfo, RegionInfo, RegionLevel, StateInfo } from './interfaces';

export const levelMegaCountyId = 'mega-county';

function parseCSV<T extends RegionInfo>(
  csv: string,
  level: RegionLevel,
  deriveDisplayName = (d: Partial<T>): string => d.name!,
  extras: (d: T) => void = () => undefined,
): T[] {
  const r: T[] = dsvFormat(';').parse(
    csv,
    (d): T => {
      const info = (Object.assign(d, {
        level,
        propertyId: d.postal || d.id,
        population:
          d.population === 'NaN' || d.population === '' || d.population == null
            ? null
            : Number.parseInt(d.population, 10),
      }) as unknown) as T;
      if (!d.displayName || d.displayName === 'X') {
        d.displayName = deriveDisplayName(info);
      }
      extras(info);
      return info;
    },
  );
  return r;
}

export const stateInfo = parseCSV<StateInfo>(stateRaw, 'state');
const stateLookup = new Map<string, StateInfo>();
stateInfo.forEach((state) => {
  stateLookup.set(state.id.toLowerCase(), state);
  stateLookup.set(state.propertyId.toLowerCase(), state);
});

const stateClasses = {
  West: ['WY', 'ID', 'MT', 'UT', 'AK', 'NM', 'CO', 'NV', 'AZ', 'OR', 'WA', 'CA', 'HI'],
  Midwest: ['SD', 'ND', 'IA', 'NE', 'MO', 'WI', 'KS', 'MN', 'IL', 'OH', 'MI', 'IN'],
  Northeast: ['PA', 'ME', 'NH', 'NJ', 'NY', 'VT', 'MA', 'RI', 'CT', 'DE'],
  South: ['OK', 'TN', 'AL', 'WV', 'AR', 'KY', 'TX', 'GA', 'SC', 'NC', 'LA', 'FL', 'VA', 'MD', 'DC', 'PR', 'MS'],
};

Object.entries(stateClasses).forEach(([key, value]) => {
  for (const v of value) {
    Object.assign(stateLookup.get(v.toLowerCase())!, { region: key });
  }
});

export const nationInfo: RegionInfo = {
  level: 'nation',
  name: 'US',
  id: 'us',
  displayName: 'United States',
  propertyId: 'us',
  population: stateInfo.reduce((acc, v) => acc + (v.population ?? 0), 0),
};

export const msaInfo = parseCSV(msaRaw, 'msa');
export const countyInfo = parseCSV(
  countyRaw,
  'county',
  (county) =>
    `${county.name!}${county.displayName !== 'X' ? ' County' : ''}, ${stateLookup.get(county.id!.slice(0, 2))!.postal}`,
  (county) => {
    const state = stateLookup.get(county.id.slice(0, 2))!;
    Object.assign(county, {
      state: state.postal,
      region: state.region,
    });
  },
);
export const hrrInfo = parseCSV<HRRInfo>(hrrRaw, 'hrr', (hrr) => `${hrr.state!} - ${hrr.name!} (HRR)`);

// generate mega counties by copying the states
export const megaCountyInfo: CountyInfo[] = stateInfo.map((info) => ({
  id: info.id + '000',
  propertyId: info.id + '000',
  name: `Rest of ${info.name}`,
  displayName: `Rest of ${info.displayName}`,
  population: undefined,
  level: levelMegaCountyId,
  region: info.region,
  state: info.id,
  lat: null,
  long: null,
}));

function sortByDisplayName(a: RegionInfo, b: RegionInfo) {
  return a.displayName.localeCompare(b.displayName);
}

export const infosByLevel = {
  nation: [nationInfo],
  state: stateInfo.sort(sortByDisplayName),
  msa: msaInfo.sort(sortByDisplayName),
  county: countyInfo.sort(sortByDisplayName),
  hrr: hrrInfo.sort(sortByDisplayName),
  [levelMegaCountyId]: megaCountyInfo.sort(sortByDisplayName),
};

export const nameInfos = (stateInfo as RegionInfo[])
  .concat(msaInfo, countyInfo, hrrInfo, megaCountyInfo)
  .sort(sortByDisplayName);

/**
 * helper to resolve a given id to a name info object
 */
const infoLookup = (() => {
  const infoLookup = new Map<string, RegionInfo>();

  function addInfo(d: RegionInfo) {
    const levelPrefix = d.level + ':';
    const id = String(d.propertyId).toLowerCase();
    if (!infoLookup.has(id)) {
      infoLookup.set(id, d);
    }
    if (!infoLookup.has(levelPrefix + id)) {
      infoLookup.set(levelPrefix + id, d);
    }
    const key = String(d.id).toLowerCase();
    if (!infoLookup.has(key)) {
      infoLookup.set(key, d);
    }
    if (!infoLookup.has(levelPrefix + key)) {
      infoLookup.set(levelPrefix + key, d);
    }
  }

  nameInfos.forEach(addInfo);

  addInfo(nationInfo);

  for (const alias of [
    ['02270', '02158'],
    ['46113', '46102'],
  ]) {
    infoLookup.set(alias[0], getInfoByName(alias[1])!);
  }
  return infoLookup;
})();

export function getInfoByName(name: string, level: RegionLevel | null = null): RegionInfo | null {
  if (!name) {
    return null;
  }
  const key = (level != null ? `${level}:` : '') + String(name).toLowerCase();
  const r = infoLookup.get(key) ?? null;
  if (!r) {
    console.warn('unknown', name, level);
  }
  return r;
}

/**
 * computes the population of the mega county as state - defined county populations
 */
export function computeMegaCountyPopulation(megaCounty: CountyInfo, data: Map<string, unknown>): number | null {
  if (!megaCounty || !data || megaCounty.level !== levelMegaCountyId) {
    return null;
  }
  const state = getInfoByName(megaCounty.state);
  if (!state || state.population == null || Number.isNaN(state.population)) {
    return null;
  }
  const population = Array.from(data.keys()).reduce((population, fips) => {
    // not in the state or the mega county
    if (!fips.startsWith(state.id) || fips === megaCounty.id) {
      return population;
    }
    const county = getInfoByName(fips);
    if (!county || county.population == null || Number.isNaN(county.population)) {
      // invalid county, so we cannot compute the rest population, keep NaN from now on
      return Number.NaN;
    }
    return population - county.population;
  }, state.population);

  return Number.isNaN(population) ? null : population;
}

/**
 * returns the counties of a state
 */
export function getCountiesOfState(state: RegionInfo): RegionInfo[] {
  return countyInfo.filter((d) => d.id.slice(0, 2) === state.id);
}
/**
 * returns the state of a county
 * @param {CountyInfo} county
 */
export function getStateOfCounty(county: CountyInfo): RegionInfo {
  return getInfoByName(county.state)!;
}
