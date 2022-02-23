import { parseAPITime } from '../../data';
import {
  getInfoByName,
  nationInfo,
  getHHSRegionOfState,
  getStateOfCounty,
  StateInfo,
  CountyInfo,
} from '../../data/regions';
import { DateParam, Region, RegionLevel, RegionParam, Sensor, SensorParam, TimeFrame } from '../../stores/params';

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
  return keys.map((k) => defaultSensor.manager.getSensor(k)).filter((d): d is Sensor => d != null);
}

export function resolveSensorParams(defaultSensor: SensorParam, keys?: readonly string[]): SensorParam[] {
  const CASES = new SensorParam(defaultSensor.manager.getDefaultCasesSignal()!, defaultSensor.manager);
  const DEATHS = new SensorParam(defaultSensor.manager.getDefaultDeathSignal()!, defaultSensor.manager);

  if (!keys || keys.length === 0 || (keys.length === 1 && !keys[0])) {
    if (defaultSensor.key === CASES.key || defaultSensor.key === DEATHS.key) {
      return [CASES, DEATHS];
    }
    return [defaultSensor, CASES, DEATHS];
  }
  if (typeof keys === 'string') {
    return [resolveSensor(defaultSensor, keys)];
  }
  return keys
    .map((k) => (k ? defaultSensor.manager.getSensor(k) : defaultSensor))
    .filter((d): d is Sensor => d != null)
    .map((s) => new SensorParam(s, defaultSensor.manager));
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

export function resolveRegions(defaultRegion: RegionParam, keys?: string[] | string): RegionParam[] {
  const regions: RegionParam[] = [];
  if (!keys || keys.length === 0 || (keys.length === 1 && !keys[0])) {
    // derive default
    regions.push(defaultRegion);
    if (defaultRegion.level === 'nation') {
      return regions;
    }
    if (defaultRegion.level === 'state') {
      const hhs = getHHSRegionOfState(defaultRegion.value as StateInfo);
      if (hhs) {
        regions.push(new RegionParam(hhs));
      }
    }
    if (defaultRegion.level === 'county') {
      const state = getStateOfCounty(defaultRegion.value as CountyInfo);
      if (state) {
        regions.push(new RegionParam(state));
      }
    }
    regions.push(new RegionParam(nationInfo));
    return regions;
  }
  if (typeof keys === 'string') {
    const rr = keys ? getInfoByName(keys) : defaultRegion;
    return rr ? [new RegionParam(rr)] : [defaultRegion];
  }
  return (keys as string[])
    .map((ri) => (ri ? getInfoByName(ri) : defaultRegion))
    .filter((r): r is Region => r != null)
    .map((r) => new RegionParam(r));
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
