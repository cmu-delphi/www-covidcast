import { ENCODING_SPIKE_THEME } from '../../../theme';
import { CustomLayer } from './CustomLayer';

// create GLSL source for vertex shader
const vertexSource = `
uniform mat4 u_matrix;
uniform vec2 u_pixelToClip;
uniform float u_zoom;

uniform float u_size;

attribute vec3 a_pos;
attribute vec4 a_colorAndValue;

varying vec3 v_color;
varying float v_discard;
varying vec4 v_data;

void main() {
  vec4 p = u_matrix * vec4(a_pos.xy, 0.0, 1.0);
  float height = (a_colorAndValue.a * u_zoom + 1.0);
  float shift = a_pos.z * (u_size * u_zoom + 1.0);

  p.y -= (1.0 - abs(a_pos.z)) * height * u_pixelToClip.y * p.w;
  p.x += shift * u_pixelToClip.x * p.w;

  gl_Position = p;
  v_color = a_colorAndValue.rgb / 255.0;
  v_discard = a_colorAndValue.a == 0.0 ? 1.0 : 0.0;
  float thickness = 1.0;
  // encode the barycentric coordinate but such that the bottom line is not shown
  v_data = vec4(-min(shift, 0.0), height, max(shift, 0.0), thickness);

}`;

// create GLSL source for fragment shader

const fragmentSource = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;
uniform float u_device_pixel_ratio;
uniform float u_opacity;

varying vec3 v_color;
varying float v_discard;
varying vec4 v_data;

// This is like
float aastep (float threshold, float dist) {
  float afwidth = fwidth(dist) * 0.5;
  return smoothstep(threshold - afwidth, threshold + afwidth, dist);
}

void main() {
  if (v_discard == 1.0) {
    discard;
  }
  vec3 barycentric = v_data.xyz;
  float stroke_width = v_data.w;

  // this will be our signed distance for the wireframe edge
  float d = min(min(barycentric.x, barycentric.y), barycentric.z);
  // compute the anti-aliased stroke edge
  float edge = 1.0 - aastep(stroke_width, d);

  vec4 fill_color = vec4(v_color * u_opacity, u_opacity);
  vec4 stroke_color = vec4(v_color, 1.0);

  gl_FragColor = mix(fill_color, stroke_color, edge);
}`;

export class SpikeLayer extends CustomLayer {
  constructor(sourceId, level) {
    super(sourceId, level, vertexSource, fragmentSource);
  }

  _createVertices(xy) {
    // need 3 points to encode which mode it is
    // -1 ... left corner
    // 0 ... center
    // 1 ... right
    return [xy.x, xy.y, -1, xy.x, xy.y, 0, xy.x, xy.y, 1];
  }

  /**
   *
   * @param {string} id
   * @returns {import('mapbox-gl').CustomLayerInterface}
   */
  asLayer(id) {
    return {
      id,
      type: 'custom',
      renderingMode: '2d',
      onAdd: (map, gl) => this.onAdd(map, gl),
      render: (gl, matrix) => this.render(gl, matrix),
      onRemove: (map, gl) => this.onRemove(map, gl),
      prerender: (gl, matrix) => this.preRender(gl, matrix),
    };
  }

  /**
   * @param {import('mapbox-gl').Map} map
   * @param {WebGLRenderingContext} gl
   */
  onAdd(map, gl) {
    gl.getExtension('OES_standard_derivatives');
    super.onAdd(map, gl);
    this._uSize = gl.getUniformLocation(this._program, 'u_size');
  }

  /**
   * @param {import('mapbox-gl').Map} _map
   * @param {WebGLRenderingContext} gl
   */
  onRemove(_map, gl) {
    super.onRemove(_map, gl);
    gl.deleteBuffer(this._indexBuffer);
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {number[]} matrix
   */
  render(gl, matrix) {
    super._prepareRender(gl, matrix);

    gl.uniform1f(this._uOpacity, ENCODING_SPIKE_THEME.fillOpacity);
    gl.uniform1f(this._uSize, ENCODING_SPIKE_THEME.size[this._level]);
    gl.drawArrays(gl.TRIANGLES, 0, this.featureIds.length * this._verticesPerFeatures);
  }
}
