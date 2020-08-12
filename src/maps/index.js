import { dsvFormat } from 'd3';
import { feature } from 'topojson-client';
import stateRaw from './processed/state.csv';
import msaRaw from './processed/msa.csv';
import countyRaw from './processed/county.csv';
import citiesRaw from './processed/cities.csv';

/**
 * @typedef {object} NameInfo
 * @property {string} name name for param
 * @property {string} displayName name to show and search
 * @property {string} id param id
 * @property {string} propertyId geojson: feature.property.id
 * @property {number} population
 * @property {number} lat center latitude
 * @property {number} long center longitude
 * @property {'state' | 'county' | 'msa'} level
 */

function parseCSV(csv, level) {
  /**
   * @type {NameInfo[]}
   */
  const r = dsvFormat(',').parse(csv, (r) => {
    return Object.assign(r, {
      level,
      displayName: r.displayName || r.name,
      propertyId: r.postal || r.id,
      population: r.population === 'NaN' || r.population === '' ? null : Number.parseInt(r.population, 10),
      lat: Number.parseFloat(r.lat),
      long: Number.parseFloat(r.long),
    });
  });
  return r;
}
const stateInfo = parseCSV(stateRaw, 'state');
const msaInfo = parseCSV(msaRaw, 'msa');
const countyInfo = parseCSV(countyRaw, 'county');

export const nameInfos = stateInfo
  .concat(msaInfo, countyInfo)
  .sort((a, b) => a.displayName.localeCompare(b.displayName));

function generateGeo(topo, level, arr, additionalProperties = {}) {
  const byId = new Map(arr.map((s) => [s.id, s]));

  const centers = [];
  const border = feature(topo, level);

  for (const f of border.features) {
    const d = byId(f.id);
    const properties = {
      ...d,
      id: d.propertyId,
      ...additionalProperties,
    };

    f.properties = properties;

    centers.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.lat, d.long],
      },
      id: d.id,
      properties,
    });
  }

  return {
    centers: {
      type: 'FeatureCollection',
      features: centers,
    },
    border,
  };
}

export function stateGeo(additionalProperties = {}) {
  return import('./processed/state.geojson.json').then((r) => generateGeo(r, 'state', stateInfo, additionalProperties));
}

export function msaGeo(additionalProperties = {}) {
  return import('./processed/msa.geojson.json').then((r) => generateGeo(r, 'msa', msaInfo, additionalProperties));
}

export function countyGeo(additionalProperties = {}) {
  return import('./processed/county.geojson.json').then((r) =>
    generateGeo(r, 'county', countyInfo, additionalProperties),
  );
}

export function zoneGeo() {
  return import('./processed/zone.geojson.json').then((r) => ({
    border: feature(r, 'zone'),
  }));
}

export function citiesGeo() {
  return Promise.resolve({
    type: 'FeatureCollection',
    features: dsvFormat(',').parse(citiesRaw, (r) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number.parseFloat(r.lat), Number.parseFloat(r.long)],
      },
      properties: {
        displayName: r.name,
        population: r.population === 'NaN' || r.population === '' ? null : Number.parseInt(r.population, 10),
      },
    })),
  });
}
