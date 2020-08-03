export function caseHovered(thenCase, elseCase, invert = false) {
  return [
    'case',
    ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
    invert ? elseCase : thenCase,
    invert ? thenCase : elseCase,
  ];
}

export const HAS_VALUE = ['>', ['get', 'value'], 0];

export function addSource(map, id) {
  map.addSource(id, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  });
}
