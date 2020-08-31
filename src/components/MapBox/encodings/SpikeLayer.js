import { MercatorCoordinate } from 'mapbox-gl';
import { MISSING_COLOR_OPENGL, MISSING_COLOR, ENCODING_SPIKE_THEME } from '../../../theme';
import { rgb } from 'd3-color';

// create GLSL source for vertex shader
const vertexSource = `
uniform mat4 u_matrix;
uniform float u_size;
uniform float u_yPixelToClip;
uniform vec2 u_jitter;
attribute vec3 a_pos;
attribute vec4 a_colorAndHeight;
varying vec3 v_color;

void main() {
  vec4 p = u_matrix * vec4(a_pos.xy, 0.0, 1.0);
  if (a_pos.z == 0.0) {
    p.y += a_colorAndHeight.a * u_yPixelToClip * p.w;
  } else {
    p.x += a_pos.z * u_size * p.w;
  }
  p.x += u_jitter.x * p.w;
  p.y += u_jitter.y * p.w;
  gl_Position = p;
  v_color = a_colorAndHeight.rgb;
}`;

// create GLSL source for fragment shader
const fragmentSource = `
precision mediump float;
uniform float u_opacity;
varying vec3 v_color;
void main() {
  gl_FragColor = vec4(v_color, u_opacity);
}`;

export class SpikeLayer {
  constructor(sourceId, level) {
    this._sourceId = sourceId;
    this._level = level;
    this._colorsDirty = true;
    this.featureIds = [];
    this._valueLookup = new Map();
    this._valuePrimaryValue = 'value';
    this._valueToColor = () => MISSING_COLOR;
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
    // create a vertex shader
    this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this._vertexShader, vertexSource);
    gl.compileShader(this._vertexShader);
    console.log(gl.getShaderInfoLog(this._vertexShader));

    // create a fragment shader
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this._fragmentShader, fragmentSource);
    gl.compileShader(this._fragmentShader);
    console.log(gl.getShaderInfoLog(this._fragmentShader));

    // link the two shaders into a WebGL program
    this._program = gl.createProgram();
    gl.attachShader(this._program, this._vertexShader);
    gl.attachShader(this._program, this._fragmentShader);
    gl.linkProgram(this._program);

    this._uPos = gl.getUniformLocation(this._program, 'u_matrix');
    this._uOpacity = gl.getUniformLocation(this._program, 'u_opacity');
    this._uSize = gl.getUniformLocation(this._program, 'u_size');
    this._uYPixelToClip = gl.getUniformLocation(this._program, 'u_yPixelToClip');
    this._uJitter = gl.getUniformLocation(this._program, 'u_jitter');

    // create and initialize a WebGLBuffer to store centers
    this._aPos = gl.getAttribLocation(this._program, 'a_pos');
    this._centerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._centerBuffer);

    // need 3 points to encode which mode it is
    // -1 ... left corner
    // 0 ... center
    // 1 ... right
    const points = map
      .getSource(this._sourceId)
      ._data.features.map((feature) => {
        const c = feature.geometry.coordinates;
        const lng = c[0];
        const lat = c[1];
        if (lat == null || Number.isNaN(lat)) {
          return [];
        }
        this.featureIds.push(feature.properties.id);
        const xy = MercatorCoordinate.fromLngLat({ lat, lng });
        return [xy.x, xy.y, -1, xy.x, xy.y, 0, xy.x, xy.y, 1];
      })
      .flat();

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    // create and initialize a WebGLBuffer to store colors
    this._aColorAndHeight = gl.getAttribLocation(this._program, 'a_colorAndHeight');
    this._colorAndHeightBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._colorAndHeightBuffer);
    this._colorAndHeightData = new Float32Array(this.featureIds.length * 4 * 3); // per vertex rgb color and height
    this._colorAndHeightData.fill(MISSING_COLOR_OPENGL[0]);
    gl.bufferData(gl.ARRAY_BUFFER, this._colorAndHeightData, gl.STATIC_DRAW);

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
    gl.deleteBuffer(this._centerBuffer);
    gl.deleteBuffer(this._colorAndHeightBuffer);
    gl.deleteBuffer(this._indexBuffer);
    gl.deleteShader(this._fragmentShader);
    gl.deleteShader(this._vertexShader);
    gl.deleteProgram(this._program);
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {number[]} matrix
   */
  render(gl, matrix) {
    gl.useProgram(this._program);
    gl.uniformMatrix4fv(this._uPos, false, matrix);
    gl.uniform1f(this._uOpacity, ENCODING_SPIKE_THEME.fillOpacity);
    const xToClip = 2 / gl.canvas.width;
    const yToClip = 2 / gl.canvas.height;
    gl.uniform1f(this._uSize, ENCODING_SPIKE_THEME.size[this._level] * xToClip);
    gl.uniform1f(this._uYPixelToClip, yToClip);
    gl.uniform2f(this._uJitter, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._colorAndHeightBuffer);
    gl.enableVertexAttribArray(this._aColorAndHeight);
    gl.vertexAttribPointer(this._aColorAndHeight, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._centerBuffer);
    gl.enableVertexAttribArray(this._aPos);
    gl.vertexAttribPointer(this._aPos, 3, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawArrays(gl.TRIANGLES, 0, this.featureIds.length * 3);

    // lines
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

    gl.uniform1f(this._uOpacity, ENCODING_SPIKE_THEME.strokeOpacity * 0.5);
    gl.uniform2f(this._uJitter, xToClip * 1, 0);
    gl.drawElements(gl.LINES, this.featureIds.length * 4, gl.UNSIGNED_SHORT, 0);

    gl.uniform2f(this._uJitter, xToClip * -1, 0);
    gl.drawElements(gl.LINES, this.featureIds.length * 4, gl.UNSIGNED_SHORT, 0);

    gl.uniform2f(this._uJitter, 0, 0);
    gl.uniform1f(this._uOpacity, ENCODING_SPIKE_THEME.strokeOpacity);
    gl.drawElements(gl.LINES, this.featureIds.length * 4, gl.UNSIGNED_SHORT, 0);
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {number[]} matrix
   */
  preRender(gl) {
    if (this._colorsDirty) {
      this._colorsDirty = false;
      for (let i = 0; i < this.featureIds.length; i++) {
        const id = this.featureIds[i];
        const v = this._valueLookup.has(id) ? this._valueLookup.get(id)[this._valuePrimaryValue] : null;

        // 3 points with each 4 components

        if (v == null || Number.isNaN(v)) {
          for (let j = 0; j < 3; j++) {
            const r = i * 4 * 3 + j * 4;
            this._colorAndHeightData[r] = MISSING_COLOR_OPENGL[0];
            this._colorAndHeightData[r + 1] = MISSING_COLOR_OPENGL[1];
            this._colorAndHeightData[r + 2] = MISSING_COLOR_OPENGL[1];
            this._colorAndHeightData[r + 3] = 0;
          }
          continue;
        }
        const color = rgb(this._valueToColor(v));
        const height = this._valueToSize(v);
        for (let j = 0; j < 3; j++) {
          const r = i * 4 * 3 + j * 4;
          this._colorAndHeightData[r] = color.r / 255;
          this._colorAndHeightData[r + 1] = color.g / 255;
          this._colorAndHeightData[r + 2] = color.b / 255;
          this._colorAndHeightData[r + 3] = height;
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this._colorAndHeightBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this._colorAndHeightData, gl.STATIC_DRAW);
    }
  }

  /**
   *
   * @param {((v: value) => string)} scale
   */
  encode(heightScale, scale) {
    this._colorsDirty = true;
    this._valueToSize = heightScale;
    this._valueToColor = scale;
  }

  updateSources(lookup, primaryValue) {
    this._colorsDirty = true;
    this._valueLookup = lookup;
    this._valuePrimaryValue = primaryValue;
  }
}
