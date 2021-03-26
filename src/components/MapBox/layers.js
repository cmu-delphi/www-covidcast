/*
Layer names used in MapBox
- state
- msa
- county
- bubble-fill
- bubble-highlight-fill
- spike
- spike-outline
- spike-outline-highlight
...
*/

import { S, toCenterSource } from './sources';

export function toFillLayer(level) {
  return `${level}-fill`;
}
export function toHoverLayer(level) {
  return `${level}-hover`;
}
export function toBubbleLayer(level) {
  return `${level}-bubble`;
}
export function toSpikeLayer(level) {
  return `${level}-spike`;
}
export function toBorderLayer(level) {
  return `${level}-border`;
}

export const L = {
  outline: 'state-stroke',
  stateNames: 'state-names',
  cityPoints: {
    pit: 'city-point-unclustered-pit',
    1: 'city-point-unclustered-1',
    2: 'city-point-unclustered-2',
    3: 'city-point-unclustered-3',
    4: 'city-point-unclustered-4',
    5: 'city-point-unclustered-5',
  },
};

/**
 * @param {import('mapbox-gl').Map} map
 */
export function addStateLabelLayer(map) {
  map.addLayer({
    id: L.stateNames,
    source: toCenterSource('state'),
    type: 'symbol',
    maxzoom: 8,
    layout: {
      'text-field': ['upcase', ['get', 'name']],
      'text-font': ['Open Sans Bold'],
      'text-size': 11,
    },
    paint: {
      'text-opacity': 0.5,
      'text-halo-color': '#fff',
      'text-halo-width': 1,
    },
  });
}

/**
 * @param {import('mapbox-gl').Map} map
 */
export function addCityLayers(map) {
  const addCityLayer = (id, filter, extras = {}) => {
    map.addLayer({
      id,
      source: S.cityPoint,
      type: 'symbol',
      ...(filter ? { filter } : {}),
      ...extras,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
      },
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 1.5,
      },
    });
  };

  addCityLayer(L.cityPoints.pit, ['==', 'name', 'Pittsburgh'], {
    maxzoom: 8,
  });
  addCityLayer(L.cityPoints.pit[1], ['>', 'population', 900000], {
    maxzoom: 4,
  });
  addCityLayer(L.cityPoints.pit[2], ['>', 'population', 500000], {
    maxzoom: 6,
    minzoom: 4,
  });
  addCityLayer(L.cityPoints.pit[3], ['>', 'population', 100000], {
    maxzoom: 8,
    minzoom: 6,
  });
  addCityLayer(L.cityPoints.pit[4], undefined, {
    minzoom: 8,
  });
}
