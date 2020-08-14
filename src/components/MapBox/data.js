import { sensorMap } from '../../stores';

export function generateDataLookup(data, sensor) {
  const values = new Map();
  const directions = new Map();
  const entry = sensorMap.get(sensor);

  data.forEach((d) => {
    const key = d.geo_value.toUpperCase();
    if (d.value != null || d.avg != null) {
      let info;
      if (entry.isCasesOrDeath) {
        info = [d.avg, d.count];
      } else {
        info = [d.value];
      }
      values.set(key, info);
    }

    if (d.direction !== null) {
      directions.set(key, d.direction);
    }
  });
  return {
    values,
    directions,
  };
}
