export { default as ChoroplethEncoding } from './choropleth';
export { default as BubbleEncoding } from './bubble';
export { default as SpikeEncodingOld } from './spike';
export { default as SpikeEncoding } from './spike2';

/**
 * @typedef {object} Encoding
 * @property {(level: string, signalType: string) => string[]} getVisibleLayers
 * @property {(map: import('mapbox-gl').Map) => void} addSources
 * @property {(map: import('mapbox-gl').Map) => void} addLayers
 * @property {(map: import('mapbox-gl').Map, level: string, signalType: string, sensor: string, valueMinMax: [number, number], stops: [number, string][]) => any} encode
 * @property {(map: import('mapbox-gl').Map, level: string) => void} updateSources
 */
