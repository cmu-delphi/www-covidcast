/**
 * helper script to compute the bounds of some geo json files and store it for the build
 */
const states = require('../src/static/maps/new_states.json');
const zones = require('../src/static/maps/new_zones.json');
const geojsonExtent = require('@mapbox/geojson-extent');
const { LngLatBounds, LngLat } = require('mapbox-gl');
const fs = require('fs');

function computeBounds(geojson, scale = 1.2) {
  const bounds = geojsonExtent(geojson);

  const mapglBounds = new LngLatBounds(new LngLat(bounds[0], bounds[1]), new LngLat(bounds[2], bounds[3]));

  if (scale === 1) {
    return mapglBounds;
  }

  const widthLng = bounds[2] - bounds[0];
  const heightLat = bounds[3] - bounds[1];

  const center = mapglBounds.getCenter();
  const targetWidth = widthLng * scale;
  const targetHeight = heightLat * scale;

  return new LngLatBounds(
    new LngLat(center.lng + targetWidth / 2, center.lat - targetHeight / 2),
    new LngLat(center.lng - targetWidth / 2, center.lat + targetHeight / 2),
  );
}

fs.writeFileSync(
  '../src/components/MapBox/bounds.json',
  JSON.stringify(
    {
      $comment: 'generated via computeBounds.js',
      states: computeBounds(states).toArray(),
      zones: computeBounds(zones).toArray(),
    },
    null,
    2,
  ),
);
