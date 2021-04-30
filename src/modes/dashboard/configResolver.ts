import { get } from 'svelte/store';
import { parseAPITime } from '../../data';
import { getInfoByName } from '../../data/regions';
import { currentSensor, times } from '../../stores';
import { allSensorsMap } from '../../stores/allSensors';
import {
  CASES,
  DateParam,
  DEATHS,
  RegionLevel,
  RegionParam,
  Sensor,
  SensorParam,
  TimeFrame,
} from '../../stores/params';

export function resolveSensor(defaultSensor: SensorParam, key?: string): SensorParam {
  if (!key) {
    return defaultSensor;
  }
  const s = allSensorsMap.get(key);
  if (!s) {
    return defaultSensor;
  }
  return new SensorParam(s, currentSensor, get(times)!);
}

export function resolveSensors(defaultSensor: SensorParam, keys?: readonly string[]): Sensor[] {
  if (!keys) {
    if (defaultSensor.key === CASES.key || defaultSensor.key === DEATHS.key) {
      return [CASES.value, DEATHS.value];
    }
    return [defaultSensor.value, CASES.value, DEATHS.value];
  }
  if (typeof keys === 'string') {
    return [resolveSensor(defaultSensor, keys).value];
  }
  return keys.map((k) => allSensorsMap.get(k)).filter((d): d is Sensor => d != null);
}

export function resolveRegion(defaultRegion: RegionParam, r?: string): RegionParam {
  if (!r) {
    return defaultRegion;
  }
  const rr = getInfoByName(r);
  if (!rr) {
    return defaultRegion;
  }
  return new RegionParam(rr);
}

export function resolveRegionLevel(defaultRegion: RegionParam, level?: RegionLevel): RegionLevel {
  if (!level) {
    return defaultRegion.level;
  }
  return level;
}

export function resolveDate(defaultDate: DateParam, d?: string): DateParam {
  if (!d) {
    return defaultDate;
  }
  return new DateParam(parseAPITime(d.toString().replace(/-/gm, '')), defaultDate.sensorTimeFrame);
}

export function resolveTimeFrame(
  defaultSensor: SensorParam,
  defaultDate: DateParam,
  d?: string | { min: string; max: string },
): TimeFrame {
  if (!d) {
    return defaultDate.windowTimeFrame;
  }
  if (typeof d === 'string') {
    const sensor = resolveSensor(defaultSensor, d);
    return sensor.timeFrame;
  }
  return new TimeFrame(
    parseAPITime(d.min.toString().replace(/-/gm, '')),
    parseAPITime(d.max.toString().replace(/-/gm, '')),
  );
}
