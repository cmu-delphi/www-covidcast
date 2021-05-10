import { parseAPITime } from '../../data';
import { getInfoByName } from '../../data/regions';
import { sensorList } from '../../stores';
import { allSensorsMap } from '../../stores/allSensors';
import { DateParam, RegionLevel, RegionParam, Sensor, SensorParam, TimeFrame } from '../../stores/params';

export function resolveSensor(defaultSensor: SensorParam, key?: string): SensorParam {
  if (!key) {
    return defaultSensor;
  }
  const s = allSensorsMap.get(key);
  if (!s) {
    return defaultSensor;
  }
  return new SensorParam(s, defaultSensor.manager);
}

export function resolveSensors(defaultSensor: SensorParam, keys?: readonly string[]): Sensor[] {
  const CASES = new SensorParam(
    sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Cases'))!,
    defaultSensor.manager,
  );
  const DEATHS = new SensorParam(
    sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Deaths'))!,
    defaultSensor.manager,
  );

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
  return new DateParam(parseAPITime(d.toString().replace(/-/gm, '')));
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
