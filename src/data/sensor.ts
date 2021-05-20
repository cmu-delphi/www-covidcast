import { formatRawValue, formatValue, formatPercentage, formatCount } from '../formats';
import { interpolateBuPu, interpolateYlGnBu, interpolateYlOrRd } from 'd3-scale-chromatic';
import { getDataSource } from './dataSourceLookup';
import type { RegionLevel } from './regions';
import type { SignalCategory, SignalFormat, SignalHighValuesAre } from './api';

export const sensorTypes: { id: SignalCategory; label: string }[] = [
  {
    id: 'public',
    label: 'Public’s Behavior',
  },
  {
    id: 'early',
    label: 'Early Indicators',
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

export interface Sensor {
  readonly key: string; // id:signal
  readonly id: string; // data source
  readonly signal: string;
  readonly rawSignal?: string; // raw signal in case of a 7day average
  readonly rawSensor?: Sensor; // raw signal in case of a 7day average

  readonly rawCumulativeSignal?: string; // raw cumulative version of this signal
  readonly rawCumulativeSensor?: Sensor; /// raw cumulative version of this signal

  readonly name: string; // signal name
  readonly unit: string;
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
  readonly valueScaleFactor: number;
  readonly xAxis: string; // x axis title
  readonly yAxis: string; // y axis value unit long
  readonly highValuesAre: SignalHighValuesAre;
  readonly is7DayAverage: boolean;
  readonly hasStdErr: boolean;
  formatValue(v: number, enforceSign?: boolean): string;

  readonly highlight?: string[];
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

export const formatter = {
  raw: formatRawValue,
  raw_count: formatCount,
  fraction: formatRawValue,
  percent: formatPercentage,
  per100k: formatValue,
};
export const yAxis = {
  raw: 'arbitrary scale',
  raw_count: 'people',
  percent: 'Percentage',
  per100k: 'per 100,000 people',
  fraction: 'Fraction of population',
};
export const units = {
  raw: 'arbitrary scale',
  raw_count: 'people',
  percent: 'per 100 people',
  per100k: 'per 100,000 people',
  fraction: 'Fraction of population',
};

export function ensureSensorStructure(
  sensor: Partial<Sensor> & { name: string; id: string; signal: string; tooltipText?: unknown; mapTitleText?: unknown },
): Sensor {
  const key = `${sensor.id}-${sensor.signal}`;

  const highValuesAre = determineHighValuesAre(sensor);
  const format = sensor.format || 'raw';

  const rawSignal = sensor.rawSignal === 'null' || sensor.rawSignal === sensor.signal ? null : sensor.rawSignal;

  const guessHelper = sensor.tooltipText || sensor.mapTitleText;
  const guessedSignalTooltip = typeof guessHelper === 'string' ? guessHelper : 'No description available';

  const full = Object.assign(sensor, {
    key,
    type: 'public',
    dataSourceName: getDataSource(sensor),
    levels: ['state'],
    description: sensor.signalTooltip || 'No description available',
    signalTooltip: guessedSignalTooltip,
    colorScale: colorScales[highValuesAre],
    vegaColorScale: vegaColorScales[highValuesAre],

    links: [],
    credits: 'We are happy for you to use this data in products and publications.',

    format,
    valueScaleFactor: format === 'fraction' ? 100 : 1,
    xAxis: 'Date',
    yAxis: yAxis[format] || yAxis.raw,
    unit: units[format] || units.raw,
    highValuesAre,
    is7DayAverage: false,
    hasStdErr: false,
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
