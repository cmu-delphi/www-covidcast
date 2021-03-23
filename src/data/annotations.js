import { parseAPITime } from './utils';
import { csvParse } from 'd3-dsv';
import { timeDay } from 'd3-time';

const ANNOTATION_SHEET = process.env.COVIDCAST_ANNOTATION_SHEET;

/**
 * @typedef {object} RawAnnotation
 * @property {string} problem
 * @property {string} explanation
 * @property {string} source
 * @property {string} signals * or a comma separated list "*"|(ID{\s*";"\s*ID}*)
 * @property {string} dates YYYYMMDD-YYYYMMDD
 * @property {string} regions semicolor separated key value: e.g. GROUP("*"|(ID{","\s*ID}*)){\s*","\s*GROUP("*"|(ID{","\s*ID}*))}
 * @property {string} 'see also'
 */

/**
 * @param {string} signals
 * @returns {'*' | Set<string>}
 */
function parseSignals(signals) {
  if (!signals) {
    return [];
  }
  const trimmed = signals.trim();
  if (trimmed === '*') {
    return '*';
  }
  return new Set(
    signals
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0),
  );
}

/**
 * @param {string} dates
 * @returns {[Date, Date]}
 */
function parseDates(dates) {
  if (!dates) {
    return [new Date(), new Date()];
  }
  const dateParts = dates
    .trim()
    .split('-')
    .map((d) => parseAPITime(d));
  if (dateParts.length === 1) {
    return [timeDay.floor(dateParts[0]), timeDay.floor(timeDay.offset(dateParts[0], 1))];
  }
  return [dateParts[0], timeDay.floor(timeDay.offset(dateParts[1], 1))];
}
/**
 * @param {string} regions
 * @returns {{level: string, ids: '*' | Set<string>}[]}
 */
function parseRegions(regions) {
  if (!regions) {
    return [];
  }
  return regions
    .trim()
    .split(';')
    .map((d) => d.trim())
    .map((d) => {
      const match = d.match(/(.*)\((.*)\)/);
      if (match) {
        const level = match.groups(1);
        const ids = match.groups(2).trim();
        if (ids === '*') {
          return { level, ids: '*' };
        }
        return {
          level,
          ids: new Set(ids.split(',').map((d) => d.trim().toLowerCase())),
        };
      }
      return null;
    })
    .filter((d) => d != null);
}

export class Annotation {
  /**
   * @param {RawAnnotation} raw
   */
  constructor(raw) {
    this.problem = raw.problem;
    this.explanation = raw.explanation;
    this.source = raw.source;
    this.signals = parseSignals(raw.signals);
    this.dates = parseDates(raw.dates);
    this.regions = parseRegions(raw.regions);
    this.see_also = raw['see also'];
  }

  /**
   * @param {import('../maps').NameInfo} region
   */
  matchRegion(region) {
    return this.regions.some((r) => r.level == region.level && (r.ids === '*' || r.ids.has(r.propertyId)));
  }

  /**
   * @param {{id: string, signal: string}} sensor
   */
  matchSensor(sensor) {
    return this.source === sensor.id && (this.signals === '*' || this.signals.has(sensor.signal));
  }

  /**
   * @param {Date} date
   */
  matchDate(date) {
    return date >= this.dates[0] && date < this.dates[1];
  }

  /**
   *
   * @param {Date} start
   * @param {Date} end
   */
  inDateRange(start, end) {
    // not outside of the range, so at least a partial overlap
    return !(end < this.dates[1] || start > this.dates[0]);
  }
}

/**
 * @returns {Promise<Annotation[]>}
 */
export function fetchAnnotations() {
  return fetch({
    url: ANNOTATION_SHEET,
  })
    .then((r) => r.text())
    .then((csv) => {
      return csvParse(csv).map((row) => new Annotation(row));
    })
    .catch((error) => {
      console.error('cannot fetch annotations', error);
      return [];
    });
}

export class AnnotationManager {
  /**
   * @param {Annotation[]} annotations
   */
  constructor(annotations = []) {
    this.annotations = annotations;
  }

  /**
   * @param {import('../maps').NameInfo} region
   * @param {Date} date
   */
  getRegionAnnotations(region, date) {
    return this.annotations.filter((d) => d.matchRegion(region) && d.matchDate(date));
  }
  /**
   * @param {{id: string, signal: string}} sensor
   * @param {import('../maps').NameInfo} region
   * @param {Date} date
   */
  getAnnotations(sensor, region, date) {
    return this.annotations.filter((d) => d.matchSensor(sensor) && d.matchRegion(region) && d.matchDate(date));
  }
  /**
   * @param {{id: string, signal: string}} sensor
   * @param {import('../maps').NameInfo} region
   * @param {Date} dateStart
   * @param {Date} dateEnd
   */
  getWindowAnnotations(sensor, region, dateStart, dateEnd) {
    return this.annotations.filter(
      (d) => d.matchSensor(sensor) && d.matchRegion(region) && d.inDateRange(dateStart, dateEnd),
    );
  }
}
