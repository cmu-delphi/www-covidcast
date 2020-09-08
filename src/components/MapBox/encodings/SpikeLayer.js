import { ENCODING_SPIKE_THEME } from '../../../theme';
import { CustomLayer } from './CustomLayer';

// create GLSL source for vertex shader
const vertexSource = `
uniform mat4 u_matrix;
uniform vec2 u_pixelToClip;
uniform float u_zoom;

uniform float u_size;
uniform vec2 u_jitter;

attribute vec3 a_pos;
attribute vec4 a_colorAndValue;

varying vec3 v_color;
varying float v_discard;

void main() {
  vec4 p = u_matrix * vec4(a_pos.xy, 0.0, 1.0);
  if (a_pos.z == 0.0) {
    p.y += a_colorAndValue.a * u_pixelToClip.y * p.w * u_zoom;
  } else {
    p.x += a_pos.z * u_size * u_pixelToClip.x * p.w * u_zoom;
  }
  p.x += u_jitter.x * u_pixelToClip.x * p.w;
  p.y += u_jitter.y * u_pixelToClip.y * p.w;
  gl_Position = p;
  v_color = a_colorAndValue.rgb / 255.0;
  v_discard = a_colorAndValue.a == 0.0 ? 1.0 : 0.0;
}`;

// create GLSL source for fragment shader

const fragmentSource = `
precision mediump float;
uniform float u_opacity;
varying vec3 v_color;
varying float v_discard;

void main() {
  if (v_discard == 1.0) {
    discard;
  }
  gl_FragColor = vec4(v_color * u_opacity, u_opacity);
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
    super.onAdd(map, gl);
    this._uSize = gl.getUniformLocation(this._program, 'u_size');
    this._uJitter = gl.getUniformLocation(this._program, 'u_jitter');

    this._indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    const data = new Uint16Array(this.featureIds.length * 4); // 2 lines or 4 vertices per feature
    for (let i = 0; i < this.featureIds.length; i++) {
      const r = i * 4;
      const triangleBase = i * 3;
      data[r] = triangleBase; // first point
      data[r + 1] = triangleBase + 1; // second point
      data[r + 2] = triangleBase + 2; // third point
      data[r + 3] = triangleBase + 1; // second point
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
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
    gl.uniform2f(this._uJitter, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.featureIds.length * this._verticesPerFeatures);
    // lines
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

    gl.uniform1f(this._uOpacity, ENCODING_SPIKE_THEME.strokeOpacity * 0.5);
    gl.uniform2f(this._uJitter, 1, 0);
    gl.drawElements(gl.LINES, this.featureIds.length * 4, gl.UNSIGNED_SHORT, 0);

    gl.uniform2f(this._uJitter, -1, 0);
    gl.drawElements(gl.LINES, this.featureIds.length * 4, gl.UNSIGNED_SHORT, 0);

    gl.uniform2f(this._uJitter, 0, 0);
    gl.uniform1f(this._uOpacity, ENCODING_SPIKE_THEME.strokeOpacity);
    gl.drawElements(gl.LINES, this.featureIds.length * 4, gl.UNSIGNED_SHORT, 0);
  }
}
