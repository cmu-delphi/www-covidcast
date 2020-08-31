import { MercatorCoordinate } from 'mapbox-gl';
import { MISSING_COLOR_OPENGL, MISSING_COLOR } from '../../../theme';
import { rgb } from 'd3-color';

// create GLSL source for vertex shader
const vertexSource = `
uniform mat4 u_matrix;
attribute vec2 a_pos;
attribute vec3 a_color;
varying vec3 v_color;

void main() {
    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
    gl_PointSize = 10.0;
    v_color = a_color;
}`;

// create GLSL source for fragment shader
const fragmentSource = `
precision mediump float;
varying vec3 v_color;
void main() {
  gl_FragColor = vec4(v_color, 1.0);
}`;

export class SpikeLayer {
  constructor(sourceId) {
    this._sourceId = sourceId;
    this._colorsDirty = true;
    this.featureIds = [];
    this._valueLookup = new Map();
    this._valuePrimaryValue = 'value';
    this._scale = () => MISSING_COLOR;
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

    // create and initialize a WebGLBuffer to store centers
    this._aPos = gl.getAttribLocation(this._program, 'a_pos');
    this._centerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._centerBuffer);

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
        return [xy.x, xy.y];
      })
      .flat();

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    // create and initialize a WebGLBuffer to store colors
    this._aColor = gl.getAttribLocation(this._program, 'a_color');
    this._colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
    this._colorData = new Float32Array(this.featureIds.length * 3);
    this._colorData.fill(MISSING_COLOR_OPENGL[0]);
    gl.bufferData(gl.ARRAY_BUFFER, this._colorData, gl.STATIC_DRAW);
  }

  /**
   * @param {import('mapbox-gl').Map} map
   * @param {WebGLRenderingContext} gl
   */
  onRemove(map, gl) {
    gl.deleteBuffer(this._centerBuffer);
    gl.deleteBuffer(this._colorBuffer);
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

    gl.bindBuffer(gl.ARRAY_BUFFER, this._centerBuffer);
    gl.enableVertexAttribArray(this._aPos);
    gl.vertexAttribPointer(this._aPos, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
    gl.enableVertexAttribArray(this._aColor);
    gl.vertexAttribPointer(this._aColor, 3, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawArrays(gl.POINTS, 0, this.featureIds.length);
    // gl.drawArrays(gl.LINE_STRIP, 0, 3);
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
        const r = i * 3;
        const v = this._valueLookup.has(id) ? this._valueLookup.get(id)[this._valuePrimaryValue] : null;
        if (v == null || Number.isNaN(v)) {
          this._colorData[r] = MISSING_COLOR_OPENGL[0];
          this._colorData[r + 1] = MISSING_COLOR_OPENGL[1];
          this._colorData[r + 2] = MISSING_COLOR_OPENGL[1];
          continue;
        }
        const color = rgb(this._scale(v));
        this._colorData[r] = color.r / 255;
        this._colorData[r + 1] = color.g / 255;
        this._colorData[r + 2] = color.b / 255;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this._colorData, gl.STATIC_DRAW);
    }
  }

  /**
   *
   * @param {'sqrt' | 'linear'} heightScaleTheme
   * @param {number} maxHeight
   * @param {number} valueMax
   * @param {((v: value) => string)} scale
   */
  encode(heightScaleTheme, maxHeight, valueMax, scale) {
    this._colorsDirty = true;
    this._scale = scale;
  }

  updateSources(lookup, primaryValue) {
    this._colorsDirty = true;
    this._valueLookup = lookup;
    this._valuePrimaryValue = primaryValue;
  }
}

// generateSources(map, level = 'county') {
//   const centers = map.getSource(S[level].center)._data;
//   const size = this.theme.size[level];

//   return {
//     type: 'FeatureCollection',
//     features: centers.features.map((feature) => {
//       const center = feature.geometry.coordinates;

//       return {
//         ...feature,
//         geometry: {
//           coordinates: [
//             [
//               [center[0] - size, center[1]],
//               [center[0], center[1]],
//               [center[0] + size, center[1]],
//             ],
//           ],
//           type: 'Polygon',
//         },
//       };
//     }),
//   };
// }
