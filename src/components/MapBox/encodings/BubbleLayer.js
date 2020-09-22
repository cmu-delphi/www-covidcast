import { ENCODING_BUBBLE_THEME } from '../../../theme';
import { CustomLayer } from './CustomLayer';

// create GLSL source for vertex shader
const vertexSource = `
uniform mat4 u_matrix;
uniform float u_zoom;
uniform vec2 u_pixelToClip;

attribute vec3 a_pos;
attribute vec4 a_colorAndValue;

varying vec3 v_color;
varying float v_discard;
varying vec4 v_data;

void main() {
  vec4 p = u_matrix * vec4(a_pos.xy, 0.0, 1.0);

  vec2 pos = vec2(a_pos.z < 0.0 ? -1.0 : 1.0, abs(a_pos.z) < 2.0 ? -1.0 : 1.0);
  p.xy += pos * u_pixelToClip * (u_zoom * a_colorAndValue.a + 1.0) * p.w;

  gl_Position = p;
  v_color = a_colorAndValue.rgb / 255.0;

  v_data = vec4(pos, a_colorAndValue.a * u_zoom, 1.0);
  v_discard = a_colorAndValue.a == 0.0 ? 1.0 : 0.0;
}`;

// create GLSL source for fragment shader

const fragmentSource = `
precision mediump float;
uniform float u_opacity;
uniform float u_device_pixel_ratio;
varying vec3 v_color;
varying float v_discard;
varying vec4 v_data;

void main() {
  if (v_discard == 1.0) {
    discard;
  }

  float extrude_length = length(v_data.xy);
  float radius = v_data.z;
  float stroke_width = v_data.w;

  float blur = -(1.0 / u_device_pixel_ratio / (radius + stroke_width));
  float opacity_t = smoothstep(0.0, blur, extrude_length - 1.0);

  float color_t = smoothstep(
      blur,
      0.0,
      extrude_length - radius / (radius + stroke_width)
  );
  vec4 fill_color = vec4(v_color * u_opacity, u_opacity);
  vec4 stroke_color = vec4(v_color, 1.0);

  gl_FragColor = opacity_t * mix(fill_color, stroke_color, color_t);
}`;

export class BubbleLayer extends CustomLayer {
  constructor(sourceId, level) {
    super(sourceId, level, vertexSource, fragmentSource);
  }

  _createVertices(xy) {
    // need 4 points to encode which mode it is
    // -1 ... top left corner
    // 1 ... top right corner
    // -2 ... bottom left corner
    // 2 ... bottom right corner
    return [xy.x, xy.y, -2, xy.x, xy.y, -1, xy.x, xy.y, 1, xy.x, xy.y, 2];
  }

  /**
   * @param {import('mapbox-gl').Map} map
   * @param {WebGLRenderingContext} gl
   */
  onAdd(map, gl) {
    super.onAdd(map, gl);

    this._indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    const data = new Uint16Array(this.featureIds.length * 6); // 2 triangles per feature
    for (let i = 0; i < this.featureIds.length; i++) {
      const r = i * 6;
      const triangleBase = i * 4;

      data[r] = triangleBase;
      data[r + 1] = triangleBase + 1;
      data[r + 2] = triangleBase + 2;

      data[r + 3] = triangleBase + 2;
      data[r + 4] = triangleBase + 3;
      data[r + 5] = triangleBase;
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

    gl.uniform1f(this._uOpacity, ENCODING_BUBBLE_THEME.fillOpacity);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.featureIds.length * 6, gl.UNSIGNED_SHORT, 0);
  }
}
