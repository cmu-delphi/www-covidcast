import { isCasesSignal, isDeathSignal } from '../../data/signals';

export function generateDataLookup(data, sensor, drawMega) {
  // Get the GEO_IDS and value/directions from the API data, including mega counties if necessary.

  const valueMappedValues = new Map();
  const directionMappedValues = new Map();
  const valueMappedMega = new Map();
  const directionMappedMega = new Map();

  const geoIds = new Set();

  data.forEach((d) => {
    const key = d.geo_value.toUpperCase();
    const megaIndicator = key.slice(-3) + '';
    const megaKey = key.slice(0, 2) + '';
    geoIds.add(key);

    if (d.value != null || d.avg != null) {
      let info;
      if (isCasesSignal(sensor) || isDeathSignal(sensor)) {
        info = [d.avg, d.count];
      } else {
        info = [d.value];
      }
      if (drawMega && megaIndicator === '000') {
        valueMappedMega.set(megaKey, info);
      } else {
        valueMappedValues.set(key, info);
      }
    }

    if (d.direction !== null) {
      if (drawMega && megaIndicator === '000') {
        directionMappedMega.set(megaKey, d.direction);
      } else {
        directionMappedValues.set(key, d.direction);
      }
    }
  });
  return {
    geoIds,
    mega: {
      value: valueMappedMega,
      direction: directionMappedMega,
    },
    value: valueMappedValues,
    direction: directionMappedValues,
  };
}
