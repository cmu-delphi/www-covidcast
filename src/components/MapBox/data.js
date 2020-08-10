import { isCasesSignal, isDeathSignal } from '../../data/signals';

export function generateDataLookup(data, sensor) {
  const values = new Map();
  const directions = new Map();

  data.forEach((d) => {
    const key = d.geo_value.toUpperCase();
    if (d.value != null || d.avg != null) {
      let info;
      if (isCasesSignal(sensor) || isDeathSignal(sensor)) {
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
