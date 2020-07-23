import { LngLatBounds, LngLat } from 'mapbox-gl';
import geojsonExtent from '@mapbox/geojson-extent';

export function computeBounds(geojson, scale = 1.2) {
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
