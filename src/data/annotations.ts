import { parseAPITime } from './utils';
import { timeDay } from 'd3-time';
import { callAnomaliesAPI } from './api';
import type { EpiDataAnomaliesRow } from './api';
import type { RegionInfo, RegionLevel } from './regions';

function parseSignals(signals: string) {
  if (!signals) {
    return new Set<string>();
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

const ALL_TIME_MIN = new Date(2019, 0, 1);

function parseDates(dates: string): [Date, Date] {
  if (!dates) {
    return [ALL_TIME_MIN, new Date()];
  }
  if (/^-\d+$/g.test(dates)) {
    const uncertaintyDays = Number.parseInt(dates);
    const today = timeDay.floor(new Date());
    return [timeDay.offset(today, uncertaintyDays), today];
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

function parseRegions(regions: string): { level: RegionLevel; ids: '*' | Set<string> }[] {
  if (!regions) {
    return [];
  }
  return regions
    .trim()
    .split(';')
    .map((d) => d.trim())
    .map((d) => {
      const match = /(.*)\((.*)\)/.exec(d);
      if (match) {
        const level = match[1] as RegionLevel;
        const ids = match[2].trim();
        if (ids === '*') {
          return { level, ids: '*' as const };
        }
        return {
          level,
          ids: new Set(ids.split(',').map((d) => d.trim().toLowerCase())),
        };
      }
      return null;
    })
    .filter((d): d is { level: RegionLevel; ids: Set<string> } => d != null);
}

export class Annotation {
  readonly problem: string;
  readonly explanation: string;
  readonly source: string;
  readonly signals: '*' | Set<string>;
  readonly dates: [Date, Date];
  readonly regions: { level: RegionLevel; ids: '*' | Set<string> }[];
  readonly uncertainty: boolean;
  readonly reference?: string;
  readonly isAllTime: boolean;

  constructor(raw: EpiDataAnomaliesRow) {
    this.source = raw.source.trim();
    this.problem = raw.problem;
    this.explanation = raw.explanation;
    this.signals = parseSignals(raw.signals);
    this.dates = parseDates(raw.dates);
    this.regions = parseRegions(raw.regions);
    this.reference = raw.reference;
    this.uncertainty = /^-\d+$/g.test(raw.dates);
    this.isAllTime = !raw.dates;
  }

  /**
   * @param {import('../data/regions').NameInfo | import('../data/regions').NameInfo[]} region
   */
  matchRegion(region: RegionInfo | RegionInfo[]): boolean {
    const regionToMatch = Array.isArray(region) ? region : [region];
    return regionToMatch.some((matchRegion) =>
      this.regions.some(
        (annotatedRegion) =>
          annotatedRegion.level == matchRegion.level &&
          (annotatedRegion.ids === '*' || annotatedRegion.ids.has(matchRegion.propertyId.toLowerCase())),
      ),
    );
  }

  matchRegionLevel(level: RegionLevel): boolean {
    return this.regions.some((annotatedRegion) => annotatedRegion.level == level);
  }

  matchSensor(sensor: { id: string; signal: string }): boolean {
    return (
      (this.source === '*' || this.source === sensor.id) && (this.signals === '*' || this.signals.has(sensor.signal))
    );
  }

  matchDate(date: Date): boolean {
    return date >= this.dates[0] && date < this.dates[1];
  }

  inDateRange(start: Date, end: Date): boolean {
    // not outside of the range, so at least a partial overlap
    return !(end < this.dates[0] || start > this.dates[1]);
  }
}

export function fetchAnnotations(): Promise<Annotation[]> {
  return callAnomaliesAPI().then((rows) => rows.map((r) => new Annotation(r)));
}

function compareDate(a: Date, b: Date) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortByDate(annotationA: Annotation, annotationB: Annotation) {
  const start = compareDate(annotationA.dates[0], annotationB.dates[1]);
  if (start === 0) {
    return compareDate(annotationA.dates[1], annotationB.dates[1]);
  }
  return start;
}

export class AnnotationManager {
  constructor(public readonly annotations: Annotation[] = []) {}

  getRegionAnnotations(region: RegionInfo | RegionInfo[], date: Date, includeUncertainty = false): Annotation[] {
    return this.annotations
      .filter(
        (d) =>
          region != null &&
          d.matchRegion(region) &&
          date != null &&
          d.matchDate(date) &&
          (includeUncertainty || !d.uncertainty),
      )
      .sort(sortByDate);
  }

  getAnnotations(
    sensor: { id: string; signal: string },
    region: RegionInfo | RegionInfo[],
    date: Date,
    includeUncertainty = false,
  ): Annotation[] {
    return this.annotations
      .filter(
        (d) =>
          sensor != null &&
          d.matchSensor(sensor) &&
          region != null &&
          d.matchRegion(region) &&
          date != null &&
          d.matchDate(date) &&
          (includeUncertainty || !d.uncertainty),
      )
      .sort(sortByDate);
  }

  getWindowAnnotations(
    sensor: { id: string; signal: string },
    region: RegionInfo | RegionInfo[],
    dateStart: Date,
    dateEnd: Date,
    includeUncertainty = false,
  ): Annotation[] {
    return this.annotations
      .filter(
        (d) =>
          sensor != null &&
          d.matchSensor(sensor) &&
          region != null &&
          d.matchRegion(region) &&
          d.inDateRange(dateStart, dateEnd) &&
          (includeUncertainty || !d.uncertainty),
      )
      .sort(sortByDate);
  }

  getMultiWindowAnnotations(
    sensors: { id: string; signal: string }[],
    region: RegionInfo | RegionInfo[],
    dateStart: Date,
    dateEnd: Date,
    includeUncertainty = false,
  ): Annotation[] {
    return this.annotations
      .filter(
        (d) =>
          sensors.some((s) => d.matchSensor(s)) &&
          region != null &&
          d.matchRegion(region) &&
          d.inDateRange(dateStart, dateEnd) &&
          (includeUncertainty || !d.uncertainty),
      )
      .sort(sortByDate);
  }

  getWindowLevelAnnotations(
    sensor: { id: string; signal: string },
    level: RegionLevel,
    dateStart: Date,
    dateEnd: Date,
    includeUncertainty = false,
  ): Annotation[] {
    return this.annotations
      .filter(
        (d) =>
          sensor != null &&
          d.matchSensor(sensor) &&
          level != null &&
          d.matchRegionLevel(level) &&
          d.inDateRange(dateStart, dateEnd) &&
          (includeUncertainty || !d.uncertainty),
      )
      .sort(sortByDate);
  }
}
