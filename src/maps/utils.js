import { feature } from 'topojson-client';

export function generateGeo(topo, level, arr, additionalProperties = {}) {
  const byId = typeof arr === 'function' ? null : new Map(arr.map((s) => [s.id, s]));

  const centers = [];
  const border = feature(topo, level);

  for (const f of border.features) {
    const d = typeof arr === 'function' ? arr(f) : byId.get(f.id);
    const properties = {
      ...d,
      id: d.propertyId,
      ...additionalProperties,
      ...(f.properties || {}),
    };

    f.properties = properties;

    centers.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [properties.lat, properties.long],
      },
      id: d.id,
      properties,
    });
  }

  return {
    center: {
      type: 'FeatureCollection',
      features: centers,
    },
    border,
  };
}
