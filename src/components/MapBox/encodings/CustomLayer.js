import { MercatorCoordinate } from 'mapbox-gl';
import { MISSING_COLOR } from '../../../theme';
import { rgb } from 'd3-color';

export class CustomLayer {
  constructor(sourceId, level, vertexSource, fragmentSource) {
    this._sourceId = sourceId;
    this._level = level;
    this._colorsDirty = true;
    this.featureIds = [];
    this._valueLookup = new Map();
    this._valuePrimaryValue = 'value';
    this._valueToColor = () => MISSING_COLOR;
    this._valueToSize = () => 0;

    this._vertexSource = vertexSource;
    this._fragmentSource = fragmentSource;
    this._map = null;
    this.zoom = 1;
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

  _createVertices(xy) {
    return [xy.x, xy.y];
  }

  /**
   * @param {import('mapbox-gl').Map} map
   * @param {WebGLRenderingContext} gl
   */
  onAdd(map, gl) {
    this._map = map;
    // create a vertex shader
    this._vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this._vertexShader, this._vertexSource);
    gl.compileShader(this._vertexShader);
    // console.log(gl.getShaderInfoLog(this._vertexShader));

    // create a fragment shader
    this._fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this._fragmentShader, this._fragmentSource);
    gl.compileShader(this._fragmentShader);
    // console.log(gl.getShaderInfoLog(this._fragmentShader));

    // link the two shaders into a WebGL program
    this._program = gl.createProgram();
    gl.attachShader(this._program, this._vertexShader);
    gl.attachShader(this._program, this._fragmentShader);
    gl.linkProgram(this._program);

    this._uPos = gl.getUniformLocation(this._program, 'u_matrix');
    this._uOpacity = gl.getUniformLocation(this._program, 'u_opacity');
    this._uPixelToClip = gl.getUniformLocation(this._program, 'u_pixelToClip');
    this._uZoom = gl.getUniformLocation(this._program, 'u_zoom');
    this._uDevicePixelRatio = gl.getUniformLocation(this._program, 'u_device_pixel_ratio');
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
        return this._createVertices(xy);
      })
      .flat();

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    // 3 coordinates per vertex
    this._verticesPerFeatures = points.length / 3 / this.featureIds.length;

    // create and initialize a WebGLBuffer to store colors
    this._aColorAndValue = gl.getAttribLocation(this._program, 'a_colorAndValue');
    this._colorAndValueBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._colorAndValueBuffer);
    this._colorAndValueData = new Float32Array(this.featureIds.length * 4 * this._verticesPerFeatures); // per vertex rgb color and radius
    this._colorAndValueData.fill(0);
    gl.bufferData(gl.ARRAY_BUFFER, this._colorAndValueData, gl.STATIC_DRAW);
  }

  /**
   * @param {import('mapbox-gl').Map} _map
   * @param {WebGLRenderingContext} gl
   */
  onRemove(_map, gl) {
    this._map = null;
    gl.deleteBuffer(this._centerBuffer);
    gl.deleteBuffer(this._colorAndValueBuffer);
    gl.deleteShader(this._fragmentShader);
    gl.deleteShader(this._vertexShader);
    gl.deleteProgram(this._program);
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {number[]} matrix
   */
  _prepareRender(gl, matrix) {
    gl.useProgram(this._program);
    gl.uniformMatrix4fv(this._uPos, false, matrix);

    const transform = this._map.painter.transform;
    gl.uniform1f(this._uZoom, this.zoom);
    gl.uniform2f(this._uPixelToClip, transform.pixelsToGLUnits[0], transform.pixelsToGLUnits[1]);
    gl.uniform1f(this._uDevicePixelRatio, window.devicePixelRatio);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._colorAndValueBuffer);
    gl.enableVertexAttribArray(this._aColorAndValue);
    gl.vertexAttribPointer(this._aColorAndValue, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._centerBuffer);
    gl.enableVertexAttribArray(this._aPos);
    gl.vertexAttribPointer(this._aPos, 3, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
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

        // 4 points with each 4 components
        const perV = this._verticesPerFeatures;

        if (v == null || Number.isNaN(v)) {
          for (let j = 0; j < perV; j++) {
            const r = i * 4 * perV + j * 4;
            this._colorAndValueData[r] = 0;
            this._colorAndValueData[r + 1] = 0;
            this._colorAndValueData[r + 2] = 0;
            this._colorAndValueData[r + 3] = 0;
          }
          continue;
        }
        const color = rgb(this._valueToColor(v));
        const size = this._valueToSize(v);
        for (let j = 0; j < perV; j++) {
          const r = i * 4 * perV + j * 4;
          this._colorAndValueData[r] = color.r;
          this._colorAndValueData[r + 1] = color.g;
          this._colorAndValueData[r + 2] = color.b;
          this._colorAndValueData[r + 3] = size;
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this._colorAndValueBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this._colorAndValueData, gl.STATIC_DRAW);
    }
  }

  /**
   *
   * @param {((v: value) => string)} scale
   */
  encode(valueScale, scale) {
    this._colorsDirty = true;
    this._valueToSize = valueScale;
    this._valueToColor = scale;
  }

  updateSources(lookup, primaryValue) {
    this._colorsDirty = true;
    this._valueLookup = lookup;
    this._valuePrimaryValue = primaryValue;
  }
}
