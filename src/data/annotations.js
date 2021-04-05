import { parseAPITime } from './utils';
import { csvParse } from 'd3-dsv';
import { timeDay } from 'd3-time';
import { fetchOptions } from './api';

const ANNOTATION_SHEET = process.env.COVIDCAST_ANNOTATION_SHEET;
const ANNOTATION_DRAFTS = process.env.COVIDCAST_ANNOTATION_DRAFTS === 'true';

/**
 * @typedef {object} RawAnnotation
 * @property {string} problem
 * @property {string} explanation
 * @property {string} source
 * @property {string} signals * or a comma separated list "*"|(ID{\s*";"\s*ID}*)
 * @property {string} dates YYYYMMDD-YYYYMMDD
 * @property {string} regions semicolor separated key value: e.g. GROUP("*"|(ID{","\s*ID}*)){\s*","\s*GROUP("*"|(ID{","\s*ID}*))}
 * @property {string} reference
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
        const level = match[1];
        const ids = match[2].trim();
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
    this.source = raw.source.trim();
    this.signals = parseSignals(raw.signals);
    this.dates = parseDates(raw.dates);
    this.regions = parseRegions(raw.regions);
    this.reference = raw.reference;
  }

  /**
   * @param {import('../maps').NameInfo | import('../maps').NameInfo[]} region
   */
  matchRegion(region) {
    const regionToMatch = Array.isArray(region) ? region : [region];
    return regionToMatch.some((matchRegion) =>
      this.regions.some(
        (annotatedRegion) =>
          annotatedRegion.level == matchRegion.level &&
          (annotatedRegion.ids === '*' || annotatedRegion.ids.has(matchRegion.propertyId.toLowerCase())),
      ),
    );
  }

  matchRegionLevel(level) {
    return this.regions.some((annotatedRegion) => annotatedRegion.level == level);
  }

  /**
   * @param {{id: string, signal: string}} sensor
   */
  matchSensor(sensor) {
    return (
      (this.source === '*' || this.source === sensor.id) && (this.signals === '*' || this.signals.has(sensor.signal))
    );
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
    return !(end < this.dates[0] || start > this.dates[1]);
  }
}

/**
 * @returns {Promise<Annotation[]>}
 */
export function fetchAnnotations() {
  return fetch(ANNOTATION_SHEET, fetchOptions)
    .then((r) => r.text())
    .then((csv) => {
      return csvParse(csv)
        .filter((d) => {
          if (!d.problem) {
            return false;
          }
          return ANNOTATION_DRAFTS || d.published === 'TRUE';
        })
        .map((row) => new Annotation(row));
    })
    .catch((error) => {
      console.error('cannot fetch annotations', error);
      return [];
    });
}

function compareDate(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
/**
 *
 * @param {Annotation} annotationA
 * @param {Annotation} annotationB
 */
function sortByDate(annotationA, annotationB) {
  const start = compareDate(annotationA.dates[0], annotationB.dates[1]);
  if (start === 0) {
    return compareDate(annotationA.dates[1], annotationB.dates[1]);
  }
  return start;
}

export class AnnotationManager {
  /**
   * @param {Annotation[]} annotations
   */
  constructor(annotations = []) {
    this.annotations = annotations;
  }

  /**
   * @param {import('../maps').NameInfo | import('../maps').NameInfo[]} region
   * @param {Date} date
   */
  getRegionAnnotations(region, date) {
    return this.annotations
      .filter((d) => region != null && d.matchRegion(region) && date != null && d.matchDate(date))
      .sort(sortByDate);
  }
  /**
   * @param {{id: string, signal: string}} sensor
   * @param {import('../maps').NameInfo | import('../maps').NameInfo[]} region
   * @param {Date} date
   */
  getAnnotations(sensor, region, date) {
    return this.annotations
      .filter(
        (d) =>
          sensor != null &&
          d.matchSensor(sensor) &&
          region != null &&
          d.matchRegion(region) &&
          date != null &&
          d.matchDate(date),
      )
      .sort(sortByDate);
  }
  /**
   * @param {{id: string, signal: string}} sensor
   * @param {import('../maps').NameInfo | import('../maps').NameInfo[]} region
   * @param {Date} dateStart
   * @param {Date} dateEnd
   */
  getWindowAnnotations(sensor, region, dateStart, dateEnd) {
    return this.annotations
      .filter(
        (d) =>
          sensor != null &&
          d.matchSensor(sensor) &&
          region != null &&
          d.matchRegion(region) &&
          d.inDateRange(dateStart, dateEnd),
      )
      .sort(sortByDate);
  }

  /**
   * @param {{id: string, signal: string}} sensor
   * @param {string} level
   * @param {Date} dateStart
   * @param {Date} dateEnd
   */
  getWindowLevelAnnotations(sensor, level, dateStart, dateEnd) {
    return this.annotations
      .filter(
        (d) =>
          sensor != null &&
          d.matchSensor(sensor) &&
          level != null &&
          d.matchRegionLevel(level) &&
          d.inDateRange(dateStart, dateEnd),
      )
      .sort(sortByDate);
  }
}
