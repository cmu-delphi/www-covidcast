import { MercatorCoordinate } from 'mapbox-gl';

// create GLSL source for vertex shader
const vertexSource = `
uniform mat4 u_matrix;
attribute vec2 a_pos;
void main() {
    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
    gl_PointSize = 10.0;
}`;

// create GLSL source for fragment shader
const fragmentSource = `
void main() {
  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
}`;

export class SpikeLayer {
  constructor(sourceId) {
    this._sourceId = sourceId;
    this.visible = true;
  }

  asLayer(id) {
    return {
      id,
      type: 'custom',
      renderingMode: '2d',
      onAdd: (map, gl) => this.onAdd(map, gl),
      render: (gl, matrix) => this.render(gl, matrix),
      onRemove: (map, gl) => this.onRemove(map, gl),
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

    // create a fragment shader
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this._fragmentShader, fragmentSource);
    gl.compileShader(this._fragmentShader);

    // link the two shaders into a WebGL program
    this._program = gl.createProgram();
    gl.attachShader(this._program, this._vertexShader);
    gl.attachShader(this._program, this._fragmentShader);
    gl.linkProgram(this._program);

    this._uPos = gl.getUniformLocation(this._program, 'u_matrix');

    // create and initialize a WebGLBuffer to store vertex and color data
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
        const xy = MercatorCoordinate.fromLngLat({ lat, lng });
        return [xy.x, xy.y];
      })
      .flat();
    this._centerBufferCount = points.length / 2;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  }

  /**
   * @param {import('mapbox-gl').Map} map
   * @param {WebGLRenderingContext} gl
   */
  onRemove(map, gl) {
    gl.deleteBuffer(this._centerBuffer);
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

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawArrays(gl.POINTS, 0, this._centerBufferCount);
    // gl.drawArrays(gl.LINE_STRIP, 0, 3);
  }

  /**
   *
   * @param {'sqrt' | 'linear'} heightScaleTheme
   * @param {number} maxHeight
   * @param {number} valueMax
   * @param {[number, string][]} stops
   */
  encode(heightScaleTheme, maxHeight, valueMax, stops) {}

  updateSources() {
    // TODO invalidate the value caches
    // map.setPaintProperty(L.spike.fill, 'fill-color', colorExpression);
    // map.setPaintProperty(L.spike.stroke, 'line-color', colorExpression);
    // map.setPaintProperty(
    //   L.spike.stroke,
    //   'line-width',
    //   caseHoveredOrSelected(this.theme.strokeWidthHighlighted, this.theme.strokeWidth[level]),
    // );
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
