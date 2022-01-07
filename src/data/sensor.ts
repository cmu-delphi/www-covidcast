import { formatter, formatSpecifiers } from '../formats';
import { interpolateBuPu, interpolateYlGnBu, interpolateYlOrRd } from 'd3-scale-chromatic';
import { getDataSource } from './dataSourceLookup';
import { defaultCountyRegion, defaultStateRegion, nationInfo, Region, RegionLevel } from './regions';
import type { EpiDataMetaInfo, SignalCategory, SignalFormat, SignalHighValuesAre } from './api';
import { isArray } from './apimodel';
import type { EpiWeek } from './EpiWeek';
import type { TimeFrame } from './TimeFrame';

export const sensorTypes: { id: SignalCategory; label: string }[] = [
  {
    id: 'public',
    label: 'Public Behavior',
  },
  {
    id: 'early',
    label: 'Early Indicators',
  },
  {
    id: 'cases_testing',
    label: 'Cases and Testing',
  },
  {
    id: 'late',
    label: 'Late Indicators',
  },
  {
    id: 'other',
    label: 'Other Indicators',
  },
];

export interface SensorLike {
  id: string;
  signal: string;
}

export interface EpiDataMetaParsedInfo extends EpiDataMetaInfo {
  maxIssue: Date;
  maxIssueWeek: EpiWeek;
  minTime: Date;
  minWeek: EpiWeek;
  maxTime: Date;
  maxWeek: EpiWeek;
  timeFrame: TimeFrame;
}

export interface Sensor {
  meta: EpiDataMetaParsedInfo;
  active: boolean;

  readonly key: string; // id:signal
  readonly id: string; // data source
  readonly signal: string;
  readonly rawSignal?: string; // raw signal in case of a 7day average
  readonly rawSensor?: Sensor; // raw signal in case of a 7day average

  readonly name: string; // signal name
  readonly unit: string;
  readonly unitShort: string;
  readonly dataSourceName: string;
  readonly type: SignalCategory;
  readonly levels: readonly RegionLevel[];
  readonly description?: string; // HTML long text description
  readonly signalTooltip: string; // short text description
  readonly colorScale: (this: void, v: number) => string;
  readonly vegaColorScale: string;

  readonly links: readonly string[]; // more information links
  readonly credits?: string; // credit text

  readonly format: SignalFormat;
  readonly isWeeklySignal: boolean;
  readonly valueScaleFactor: number;
  readonly xAxis: string; // x axis title
  readonly yAxis: string; // y axis value unit long
  readonly highValuesAre: SignalHighValuesAre;
  readonly is7DayAverage: boolean;
  readonly hasStdErr: boolean;

  readonly formatSpecifier: string;
  formatValue(v?: number | null, enforceSign?: boolean): string;
}

function determineHighValuesAre(sensor: {
  isInverted?: boolean;
  highValuesAre?: Sensor['highValuesAre'];
}): Sensor['highValuesAre'] {
  if (typeof sensor.isInverted === 'boolean') {
    return sensor.isInverted ? 'good' : 'bad';
  }
  const given = sensor.highValuesAre;
  if (given === 'bad' || given === 'good' || given === 'neutral') {
    return given;
  }
  return 'bad';
}

export const colorScales = {
  good: interpolateYlGnBu,
  bad: interpolateYlOrRd,
  neutral: interpolateBuPu,
};
export const vegaColorScales = {
  good: 'yellowgreenblue',
  bad: 'yelloworangered',
  neutral: 'bluepurple',
};

export const yAxis = {
  raw: 'arbitrary scale',
  raw_count: 'people',
  count: 'people',
  percent: 'Percentage',
  per100k: 'per 100,000 people',
  fraction: 'Fraction of population',
};
export const units = {
  raw: 'arbitrary scale',
  raw_count: 'people',
  count: 'people',
  percent: 'per 100 people',
  per100k: 'per 100,000 people',
  fraction: 'Fraction of population',
};

export function ensureSensorStructure(sensor: Partial<Sensor> & { name: string; id: string; signal: string }): Sensor {
  const key = `${sensor.id}-${sensor.signal}`;

  const highValuesAre = determineHighValuesAre(sensor);
  const format = sensor.format || 'raw';

  const rawSignal = sensor.rawSignal === 'null' || sensor.rawSignal === sensor.signal ? null : sensor.rawSignal;

  const full = Object.assign(sensor, {
    key,
    type: 'public',
    dataSourceName: getDataSource(sensor),
    levels: ['state'],
    description: sensor.description || 'No description available',
    signalTooltip: sensor.signalTooltip || 'No description available',
    colorScale: colorScales[highValuesAre],
    vegaColorScale: vegaColorScales[highValuesAre],

    links: [],
    credits: 'We are happy for you to use this data in products and publications.',

    format,
    valueScaleFactor: format === 'fraction' ? 100 : 1,
    xAxis: 'Date',
    yAxis: yAxis[format] || yAxis.raw,
    unit: units[format] || units.raw,
    unitShort: format === 'per100k' ? 'per 100k' : format === 'percent' ? 'per 100' : units[format] || units.raw,
    highValuesAre,
    is7DayAverage: false,
    hasStdErr: false,
    formatSpecifier: formatSpecifiers[format] || formatSpecifiers.raw,
    formatValue: formatter[format] || formatter.raw,

    // keep the original values
    ...sensor,
    rawSignal,
  });

  if (rawSignal) {
    // create a raw version
    Object.assign(full, {
      rawSensor: {
        ...full,
        key: `${sensor.id}-${rawSignal}`,
        name: `${full.name.replace('(7-day average)', '')} (Raw)`,
        description: full.description.replace('(7-day average)', ''),
        signal: rawSignal,
        is7DayAverage: false,
        rawSensor: null,
        rawSignal: null,
      },
    });
  }
  return full as Sensor;
}

export function splitDailyWeekly<T extends { isWeeklySignal?: boolean }>(
  sensors: T | readonly T[],
): [{ type: 'day'; sensors: T[] }, { type: 'week'; sensors: T[] }] {
  const arr = isArray(sensors) ? sensors : [sensors];
  const day: T[] = [];
  const week: T[] = [];
  for (const s of arr) {
    if (s.isWeeklySignal) {
      week.push(s);
    } else {
      day.push(s);
    }
  }
  return [
    { type: 'day', sensors: day },
    { type: 'week', sensors: week },
  ];
}

export function resolveDefaultRegion(sensor: Sensor): Region {
  if (sensor.levels.includes('nation')) {
    return nationInfo;
  }
  if (sensor.levels.includes('state')) {
    return defaultStateRegion;
  }
  if (sensor.levels.includes('county')) {
    return defaultCountyRegion;
  }
  return nationInfo;
}

/**
 * checks whether multiple regions of the same sensor can be shown on a single axis without harm
 * @param sensor
 * @returns
 */
export function isComparableAcrossRegions(sensor: Sensor): boolean {
  return sensor.format === 'fraction' || sensor.format === 'per100k' || sensor.format === 'percent';
}

/**
 * groups sensor by their compatibility, i.e. can be shown on the same axis
 */
export function toSignalCompatibilityGroups(sensors: readonly Sensor[]): Sensor[][] {
  if (sensors.length === 1) {
    return [sensors.slice()];
  }
  const byFormat = new Map<string, Sensor[]>();
  const byFormatList: Sensor[][] = [];
  for (const sensor of sensors) {
    if (isComparableAcrossRegions(sensor)) {
      // can combine with others of same format
      const entry = byFormat.get(sensor.format);
      if (entry) {
        entry.push(sensor);
      } else {
        const list = [sensor];
        byFormatList.push(list);
        byFormat.set(sensor.format, list);
      }
    } else {
      // need to be alone
      byFormatList.push([sensor]);
    }
  }
  return byFormatList;
}
