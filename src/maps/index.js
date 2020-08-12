import { dsvFormat } from 'd3';
import { feature } from 'topojson-client';
import stateRaw from './processed/state.csv';
import msaRaw from './processed/msa.csv';

/**
 * @typedef {object} NameInfo
 * @property {string} display_name name to show and search
 * @property {string} name name for param
 * @property {string} id param id
 * @property {string} property_id geojson: feature.property.id
 * @property {number} population
 * @property {number} area
 * @property {'state' | 'county' | 'msa'} level
 */

function parseCSV(csv) {
  /**
   * @type {{id: string,name:string,population:number,lat:number,long:number}[]}
   */
  const r = dsvFormat(',').parse(csv, (r) => {
    return Object.assign(r, {
      population: Number.parseInt(r.population, 10),
      lat: Number.parseFloat(r.lat),
      long: Number.parseFloat(r.long),
    });
  });
  return r;
}
/**
 * @type {{id: string,postal:string,name:string,population:number,lat:number,long:number}[]}
 */
const stateInfo = parseCSV(stateRaw);
const msaInfo = parseCSV(msaRaw);

function generateGeo(topo, level, arr, propertyIdGen = (d) => d.id) {
  const centers = {
    type: 'FeatureCollection',
    features: arr.map((d) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.lat, d.long],
      },
      id: d.id,
      properties: {
        level,
        id: propertyIdGen(d),
        name: d.name,
        population: d.population,
      },
    })),
  };

  const border = feature(topo, level);
  const byId = new Map(arr.map((s) => [s.id, s]));

  for (const f of border.features) {
    const d = byId(f.id);
    Object.assign(f, {
      properties: {
        level,
        id: propertyIdGen(d),
        name: d.name,
        population: d.population,
      },
    });
  }
  return { centers, border };
}

export function stateGeo() {
  return import('./processed/state.geojson.json').then((r) => generateGeo(r, 'state', stateInfo, (d) => d.postal));
}

export function msaGeo() {
  return import('./processed/msa.geojson.json').then((r) => generateGeo(r, 'msa', msaInfo));
}
