import { ENCODING_BUBBLE_THEME } from '../../../theme';
import { CustomLayer } from './CustomLayer';

// create GLSL source for vertex shader
const vertexSource = `
uniform mat4 u_matrix;
uniform float u_size;
uniform float u_yPixelToClip;
uniform vec2 u_jitter;
uniform vec2 u_zoom;

attribute vec3 a_pos;
attribute vec4 a_colorAndRadius;

varying vec3 v_color;
varying float v_discard;

void main() {
  vec4 p = u_matrix * vec4(a_pos.xy, 0.0, 1.0);
  if (a_pos.z == 0.0) {
    p.y += a_colorAndRadius.a * u_yPixelToClip * p.w * u_zoom.x;
  } else {
    p.x += a_pos.z * u_size * p.w * u_zoom.y;
  }
  p.x += u_jitter.x * p.w;
  p.y += u_jitter.y * p.w;
  gl_Position = p;
  v_color = a_colorAndRadius.rgb / 255.0;
  v_discard = a_colorAndRadius.a == 0.0 ? 1.0 : 0.0;
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

  _setUniforms(gl) {
    gl.uniform1f(this._uOpacity, ENCODING_BUBBLE_THEME.fillOpacity);
  }
}
