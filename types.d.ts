declare module 'geo-albers-usa-territories' {
  import type { GeoProjection } from 'd3-geo';

  export function geoAlbersUsaTerritories(): GeoProjection;
}

declare module 'd3-geo/src/projection/fit' {
  import type {
    GeoProjection,
    ExtendedFeature,
    ExtendedFeatureCollection,
    ExtendedGeometryCollection,
    GeoGeometryObjects,
  } from 'd3-geo';

  /**
   * Sets the projection’s scale and translate to fit the specified geographic feature in the center of the given extent.
   * Returns the projection.
   *
   * Any clip extent is ignored when determining the new scale and translate. The precision used to compute the bounding box of the given object is computed at an effective scale of 150.
   *
   * @param extent The extent, specified as an array [[x₀, y₀], [x₁, y₁]], where x₀ is the left side of the bounding box, y₀ is the top, x₁ is the right and y₁ is the bottom.
   * @param object A geographic feature supported by d3-geo (An extension of GeoJSON feature).
   */
  export function fitExtent(
    r: GeoProjection,
    extent: [[number, number], [number, number]],
    object: ExtendedFeature,
  ): GeoProjection;
  /**
   * Sets the projection’s scale and translate to fit the specified geographic feature collection in the center of the given extent.
   * Returns the projection.
   *
   * Any clip extent is ignored when determining the new scale and translate. The precision used to compute the bounding box of the given object is computed at an effective scale of 150.
   *
   * @param extent The extent, specified as an array [[x₀, y₀], [x₁, y₁]], where x₀ is the left side of the bounding box, y₀ is the top, x₁ is the right and y₁ is the bottom.
   * @param object A geographic feature collection supported by d3-geo (An extension of GeoJSON feature collection).
   */
  export function fitExtent(
    r: GeoProjection,
    extent: [[number, number], [number, number]],
    object: ExtendedFeatureCollection,
  ): GeoProjection;
  /**
   * Sets the projection’s scale and translate to fit the specified geographic geometry object in the center of the given extent.
   * Returns the projection.
   *
   * Any clip extent is ignored when determining the new scale and translate. The precision used to compute the bounding box of the given object is computed at an effective scale of 150.
   *
   * @param extent The extent, specified as an array [[x₀, y₀], [x₁, y₁]], where x₀ is the left side of the bounding box, y₀ is the top, x₁ is the right and y₁ is the bottom.
   * @param object A GeoJson Geometry Object or GeoSphere object supported by d3-geo (An extension of GeoJSON).
   */
  export function fitExtent(
    r: GeoProjection,
    extent: [[number, number], [number, number]],
    object: GeoGeometryObjects,
  ): GeoProjection;
  /**
   * Sets the projection’s scale and translate to fit the specified geographic geometry collection in the center of the given extent.
   * Returns the projection.
   *
   * Any clip extent is ignored when determining the new scale and translate. The precision used to compute the bounding box of the given object is computed at an effective scale of 150.
   *
   * @param extent The extent, specified as an array [[x₀, y₀], [x₁, y₁]], where x₀ is the left side of the bounding box, y₀ is the top, x₁ is the right and y₁ is the bottom.
   * @param object A geographic geometry collection supported by d3-geo (An extension of GeoJSON geometry collection).
   */
  export function fitExtent(
    r: GeoProjection,
    extent: [[number, number], [number, number]],
    object: ExtendedGeometryCollection,
  ): GeoProjection;

  /**
   * Sets the projection’s scale and translate to fit the specified geographic feature in the center of an extent with the given size and top-left corner of [0, 0].
   * Returns the projection.
   *
   * Any clip extent is ignored when determining the new scale and translate. The precision used to compute the bounding box of the given object is computed at an effective scale of 150.
   *
   * @param size The size of the extent, specified as an array [width, height].
   * @param object A geographic feature supported by d3-geo (An extension of GeoJSON feature).
   */
  export function fitSize(r: GeoProjection, size: [number, number], object: ExtendedFeature): GeoProjection;
  /**
   * Sets the projection’s scale and translate to fit the specified geographic feature collection in the center of an extent with the given size and top-left corner of [0, 0].
   * Returns the projection.
   *
   * Any clip extent is ignored when determining the new scale and translate. The precision used to compute the bounding box of the given object is computed at an effective scale of 150.
   *
   * @param size The size of the extent, specified as an array [width, height].
   * @param object A geographic feature collection supported by d3-geo (An extension of GeoJSON feature collection).
   */
  export function fitSize(r: GeoProjection, size: [number, number], object: ExtendedFeatureCollection): GeoProjection;
  /**
   * Sets the projection’s scale and translate to fit the specified geographic geometry object in the center of an extent with the given size and top-left corner of [0, 0].
   * Returns the projection.
   *
   * Any clip extent is ignored when determining the new scale and translate. The precision used to compute the bounding box of the given object is computed at an effective scale of 150.
   *
   * @param size The size of the extent, specified as an array [width, height].
   * @param object A GeoJson Geometry Object or GeoSphere object supported by d3-geo (An extension of GeoJSON).
   */
  export function fitSize(r: GeoProjection, size: [number, number], object: GeoGeometryObjects): GeoProjection;
  /**
   * Sets the projection’s scale and translate to fit the specified geographic geometry collection in the center of an extent with the given size and top-left corner of [0, 0].
   * Returns the projection.
   *
   * Any clip extent is ignored when determining the new scale and translate. The precision used to compute the bounding box of the given object is computed at an effective scale of 150.
   *
   * @param size The size of the extent, specified as an array [width, height].
   * @param object A geographic geometry collection supported by d3-geo (An extension of GeoJSON geometry collection).
   */
  export function fitSize(r: GeoProjection, size: [number, number], object: ExtendedGeometryCollection): GeoProjection;

  /**
   * A convenience method for projection.fitSize where the height is automatically chosen from the aspect ratio of object and the given constraint on width.
   *
   * @param width The width of the extent.
   * @param object A geographic feature supported by d3-geo (An extension of GeoJSON feature).
   */
  export function fitWidth(r: GeoProjection, width: number, object: ExtendedFeature): GeoProjection;
  /**
   * A convenience method for projection.fitSize where the height is automatically chosen from the aspect ratio of object and the given constraint on width.
   *
   * @param width The width of the extent.
   * @param object A GeoJson Geometry Object or GeoSphere object supported by d3-geo (An extension of GeoJSON).
   */
  export function fitWidth(r: GeoProjection, width: number, object: ExtendedFeatureCollection): GeoProjection;
  /**
   * A convenience method for projection.fitSize where the height is automatically chosen from the aspect ratio of object and the given constraint on width.
   *
   * @param width The width of the extent.
   * @param object A geographic feature supported by d3-geo (An extension of GeoJSON feature).
   */
  export function fitWidth(r: GeoProjection, width: number, object: GeoGeometryObjects): GeoProjection;
  /**
   * A convenience method for projection.fitSize where the height is automatically chosen from the aspect ratio of object and the given constraint on width.
   *
   * @param width The width of the extent.
   * @param object A geographic geometry collection supported by d3-geo (An extension of GeoJSON geometry collection).
   */
  export function fitWidth(r: GeoProjection, width: number, object: ExtendedGeometryCollection): GeoProjection;

  /**
   * A convenience method for projection.fitSize where the width is automatically chosen from the aspect ratio of object and the given constraint on height.
   *
   * @param height The height of the extent.
   * @param object A geographic feature supported by d3-geo (An extension of GeoJSON feature).
   */
  export function fitHeight(r: GeoProjection, height: number, object: ExtendedFeature): GeoProjection;
  /**
   * A convenience method for projection.fitSize where the width is automatically chosen from the aspect ratio of object and the given constraint on height.
   *
   * @param height The height of the extent.
   * @param object A GeoJson Geometry Object or GeoSphere object supported by d3-geo (An extension of GeoJSON).
   */
  export function fitHeight(r: GeoProjection, height: number, object: ExtendedFeatureCollection): GeoProjection;
  /**
   * A convenience method for projection.fitSize where the width is automatically chosen from the aspect ratio of object and the given constraint on height.
   *
   * @param height The height of the extent.
   * @param object A geographic feature supported by d3-geo (An extension of GeoJSON feature).
   */
  export function fitHeight(r: GeoProjection, height: number, object: GeoGeometryObjects): GeoProjection;
  /**
   * A convenience method for projection.fitSize where the width is automatically chosen from the aspect ratio of object and the given constraint on height.
   *
   * @param height The height of the extent.
   * @param object A geographic geometry collection supported by d3-geo (An extension of GeoJSON geometry collection).
   */
  export function fitHeight(r: GeoProjection, height: number, object: ExtendedGeometryCollection): GeoProjection;
}
