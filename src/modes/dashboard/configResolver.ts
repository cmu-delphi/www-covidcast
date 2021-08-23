import { parseAPITime } from '../../data';
import type { SensorSensor } from '../../data/meta';
import { getInfoByName } from '../../data/regions';
import { DateParam, RegionLevel, RegionParam, Sensor, SensorParam, TimeFrame } from '../../stores/params';

export function resolveSensor(defaultSensor: SensorParam, key?: string): SensorParam {
  if (!key) {
    return defaultSensor;
  }
  const s = defaultSensor.manager.getSensor(key);
  if (!s) {
    return defaultSensor;
  }
  return new SensorParam(s, defaultSensor.manager);
}

export function resolveSensors(defaultSensor: SensorParam, keys?: readonly string[]): Sensor[] {
  const CASES = new SensorParam(defaultSensor.manager.getDefaultCasesSignal()!, defaultSensor.manager);
  const DEATHS = new SensorParam(defaultSensor.manager.getDefaultDeathSignal()!, defaultSensor.manager);

  if (!keys) {
    if (defaultSensor.key === CASES.key || defaultSensor.key === DEATHS.key) {
      return [CASES.value, DEATHS.value];
    }
    return [defaultSensor.value, CASES.value, DEATHS.value];
  }
  if (typeof keys === 'string') {
    return [resolveSensor(defaultSensor, keys).value];
  }
  return keys.map((k) => defaultSensor.manager.getSensor(k)).filter((d): d is SensorSensor => d != null);
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
  return new DateParam(parseAPITime(d.toString().replace(/-/gm, '').replace(/W/gm, '')));
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
    parseAPITime(d.min.toString().replace(/-/gm, '').replace(/W/gm, '')),
    parseAPITime(d.max.toString().replace(/-/gm, '').replace(/W/gm, '')),
  );
}
