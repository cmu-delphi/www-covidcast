import { EpiDataRow, parseData } from '.';
import type { Sensor } from '../stores/constants';
import { callAPI, EpiDataJSONRow } from './api';
import { GeoPair, isArray, SourceSignalPair, TimePair, groupByLevel, groupBySource } from './apimodel';
import { EpiWeek } from './EpiWeek';
import type { RegionInfo as Region, RegionLevel } from './regions';
import { splitDailyWeekly } from './sensor';
import type { TimeFrame } from './TimeFrame';
import { toTimeValue, toTimeWeekValue } from './utils';

function toGeoPair(
  transfer: (keyof EpiDataJSONRow)[],
  mixinValues: Partial<EpiDataRow>,
  region: Region | RegionLevel | readonly Region[],
) {
  if (typeof region === 'string') {
    // single level
    mixinValues.geo_type = region;
    transfer.push('geo_value');
    return new GeoPair(region, '*');
  }
  if (!isArray(region)) {
    mixinValues.geo_type = region.level;
    mixinValues.geo_value = region.propertyId;
    return GeoPair.from(region);
  }
  const grouped = groupByLevel(region);
  if (grouped.length === 1) {
    mixinValues.geo_type = grouped[0].level;

    if (grouped[0].regions.length === 1) {
      mixinValues.geo_value = grouped[0].regions[0];
      return new GeoPair(grouped[0].level, grouped[0].regions[0]);
    }
    transfer.push('geo_value');
    return new GeoPair(grouped[0].level, grouped[0].regions);
  }
  transfer.push('geo_type', 'geo_value');
  return grouped.map((group) => new GeoPair(group.level, group.regions));
}

function toSourceSignalPair<S extends { id: string; signal: string; valueScaleFactor?: number }>(
  transfer: (keyof EpiDataJSONRow)[],
  mixinValues: Partial<EpiDataRow>,
  sensor: readonly S[],
) {
  const grouped = groupBySource(sensor);

  let factor: number | ((row: EpiDataRow) => number);

  const valueScaleFactors = [...new Set(sensor.map((s) => s.valueScaleFactor ?? 1))];
  if (valueScaleFactors.length === 1) {
    factor = valueScaleFactors[0];
  } else {
    factor = (row: EpiDataRow) =>
      sensor.find((s) => s.id === row.source && s.signal == row.signal)?.valueScaleFactor ?? 1;
  }
  if (grouped.length === 1) {
    mixinValues.source = grouped[0].source;

    const firstSensor = grouped[0].sensors[0];
    if (grouped[0].sensors.length === 1) {
      mixinValues.signal = firstSensor.signal;
      return {
        factor,
        sourceSignalPairs: SourceSignalPair.from(firstSensor),
      };
    }
    transfer.push('signal');
    return {
      factor,
      sourceSignalPairs: new SourceSignalPair(
        grouped[0].source,
        grouped[0].sensors.map((d) => d.signal),
      ),
    };
  }

  transfer.push('source', 'signal');
  return {
    factor,
    sourceSignalPairs: grouped.map(
      (group) =>
        new SourceSignalPair(
          group.source,
          group.sensors.map((d) => d.signal),
        ),
    ),
  };
}

function resolveBackwardOverrides(
  rows: EpiDataRow[],
  overrides: { level: RegionLevel; fromId: string; fromSignal: string; toId: string; toSignal: string }[],
): EpiDataRow[] {
  if (overrides.length === 0) {
    return rows;
  }
  function toKey(id: string, signal: string, level: RegionLevel) {
    return `${id}@${signal}@${level}`;
  }
  const over = new Map(overrides.map((o) => [toKey(o.toId, o.toSignal, o.level), o]));
  for (const row of rows) {
    const key = toKey(row.source, row.signal, row.geo_type);
    const signalOverride = over.get(key);
    if (signalOverride) {
      row.source = signalOverride.fromId;
      row.signal = signalOverride.fromSignal;
    }
  }
  return rows;
}

function mapOverrides(
  overrides: { level: RegionLevel; fromId: string; fromSignal: string; toId: string; toSignal: string }[],
  typeSensors: readonly { id: string; signal: string; valueScaleFactor?: number }[],
) {
  if (overrides.length === 0) {
    return typeSensors;
  }
  return typeSensors.map((d) => {
    for (const o of overrides) {
      if (o.fromId === d.id && o.fromSignal === d.signal) {
        return {
          id: o.toId,
          signal: o.toSignal,
          valueScaleFactor: d.valueScaleFactor,
        };
      }
    }
    return d;
  });
}

export default function fetchTriple<
  S extends {
    id: string;
    signal: string;
    format: Sensor['format'];
    isWeeklySignal: boolean;
    overrides?: Sensor['overrides'];
    valueScaleFactor?: number;
  },
>(
  sensor: S | readonly S[],
  region: Region | RegionLevel | readonly Region[],
  date: TimeFrame | Date,
  { advanced = false, stderr = true, asOf = null as null | Date | EpiWeek } = {},
): Promise<EpiDataRow[]> {
  const transfer: (keyof EpiDataJSONRow)[] = ['value'];
  if (stderr) {
    transfer.push('stderr');
  }
  if (advanced) {
    transfer.push('sample_size', 'issue');
  }

  function fixAsOf() {
    if (asOf instanceof EpiWeek) {
      return asOf.toDate();
    }
    return asOf;
  }

  function resolveForwardOverrides(geoPairs: GeoPair | GeoPair[], typeSensors: readonly S[]) {
    const levels = Array.from(
      new Set<RegionLevel>(Array.isArray(geoPairs) ? geoPairs.map((d) => d.level) : [geoPairs.level]),
    );
    const overrides: { level: RegionLevel; fromId: string; fromSignal: string; toId: string; toSignal: string }[] = [];
    for (const sensor of typeSensors) {
      if (!sensor.overrides) {
        continue;
      }
      for (const level of levels) {
        if (sensor.overrides[level] != null) {
          // override
          overrides.push({
            level,
            fromId: sensor.id,
            fromSignal: sensor.signal,
            toId: sensor.overrides[level]!.id,
            toSignal: sensor.overrides[level]!.signal,
          });
        }
      }
    }
    return { overrides, levels };
  }

  function fetchImpl(
    type: 'day' | 'week',
    geoPairs: GeoPair | GeoPair[],
    typeSensors: readonly S[],
    typedTransfer: (keyof EpiDataJSONRow)[],
    typedMixinValues: Partial<EpiDataRow>,
  ) {
    typedMixinValues.time_type = type;
    if (date instanceof Date) {
      // single level and single date
      typedMixinValues.time_value = type === 'day' ? toTimeValue(date) : toTimeWeekValue(date);
      typedMixinValues.date_value = date;
      typedMixinValues.week_value = EpiWeek.fromDate(date);
    } else {
      typedTransfer.push('time_value');
    }
    const timePair = new TimePair(type, date);

    const { overrides, levels } = resolveForwardOverrides(geoPairs, typeSensors);

    if (overrides.length === 0 || levels.length === 1) {
      // simple case: none or direct replacement
      const mappedSensors = mapOverrides(overrides, typeSensors);
      const { sourceSignalPairs, factor } = toSourceSignalPair(typedTransfer, typedMixinValues, mappedSensors);
      return callAPI(type, sourceSignalPairs, geoPairs, timePair, typedTransfer, {
        asOf: fixAsOf(),
      }).then((rows) => resolveBackwardOverrides(parseData(rows, typedMixinValues, factor), overrides));
    }

    // multiple calls one for each mapped level
    const mappedLevels = Array.from(new Set(overrides.map((d) => d.level)));
    const calls: Promise<EpiDataRow[]>[] = [];
    const geo = Array.isArray(geoPairs) ? geoPairs : [geoPairs];
    for (const mappedLevel of mappedLevels) {
      // compute subset of what needs to be mapped and can be transferred at once
      const levelOverrides = overrides.filter((d) => d.level === mappedLevel);
      const levelGeo = geo.filter((d) => d.level === mappedLevel);

      const mappedSensors = mapOverrides(levelOverrides, typeSensors);
      const levelTransfer = typedTransfer.slice();
      const levelMixins = { ...typedMixinValues };
      const { sourceSignalPairs, factor } = toSourceSignalPair(levelTransfer, levelMixins, mappedSensors);
      calls.push(
        callAPI(type, sourceSignalPairs, levelGeo, timePair, levelTransfer, {
          asOf: fixAsOf(),
        }).then((rows) => resolveBackwardOverrides(parseData(rows, levelMixins, factor), levelOverrides)),
      );
    }
    const unmappedLevels = levels.filter((d) => !mappedLevels.includes(d));
    if (unmappedLevels.length > 0) {
      // compute subset of what needs to be mapped and can be transferred at once
      const levelGeo = geo.filter((d) => unmappedLevels.includes(d.level));
      const levelTransfer = typedTransfer.slice();
      const levelMixins = { ...typedMixinValues };
      const { sourceSignalPairs, factor } = toSourceSignalPair(levelTransfer, levelMixins, typeSensors);
      calls.push(
        callAPI(type, sourceSignalPairs, levelGeo, timePair, levelTransfer, {
          asOf: fixAsOf(),
        }).then((rows) => parseData(rows, levelMixins, factor)),
      );
    }
    return Promise.all(calls).then((r) => ([] as EpiDataRow[]).concat(...r));
  }

  const [day, week] = splitDailyWeekly(sensor);
  const mixinValues: Partial<EpiDataRow> = {};
  const geoPairs = toGeoPair(transfer, mixinValues, region);

  if (day.sensors.length === 0) {
    // all weekly
    return fetchImpl(week.type, geoPairs, week.sensors, transfer, mixinValues);
  } else if (week.sensors.length === 0) {
    // all day
    return fetchImpl(day.type, geoPairs, day.sensors, transfer, mixinValues);
  }
  // mix
  return Promise.all([
    // work on copies!
    fetchImpl(day.type, geoPairs, day.sensors, transfer.slice(), { ...mixinValues }),
    fetchImpl(week.type, geoPairs, week.sensors, transfer.slice(), { ...mixinValues }),
  ]).then((r) => ([] as EpiDataRow[]).concat(...r));
}
