import { L } from './layers';
import { LngLatBounds } from 'mapbox-gl';

export default class ZoomMap {
  constructor(bounds) {
    /**
     * @type {import('mapbox-gl').Map | null}
     */
    this.map = null;
    // TODO customize
    this.resetBounds = new LngLatBounds(bounds);
    this.resetBoundsOptions = {
      padding: 20, //px
      linear: false,
    };
    this.stateZoom = 1;
    this.initialZoomView = true;
  }

  getZoom() {
    return this.map ? this.map.getZoom() : 0;
  }

  getMaxZoom() {
    return this.map ? this.map.getMaxZoom() : 100;
  }

  getMinZoom() {
    return this.map ? this.map.getMinZoom() : -100;
  }

  zoomIn() {
    if (!this.map) {
      return;
    }
    this.initialZoomView = false;
    this.map.zoomIn();
  }

  zoomOut() {
    if (!this.map) {
      return;
    }
    this.initialZoomView = false;
    this.map.zoomOut();
  }

  resetZoom() {
    if (!this.map) {
      return;
    }
    this.initialZoomView = true;
    this.map.fitBounds(this.resetBounds, this.resetBoundsOptions);
    this.map.once('idle', () => {
      this.ready();
    });
  }

  ready() {
    this.stateZoom = this.map.getZoom();
  }

  resized() {
    if (!this.initialZoomView || !this.map) {
      return;
    }
    requestAnimationFrame(() => {
      this.map.fitBounds(this.resetBounds, this.resetBoundsOptions);
    });
  }

  /**
   * @param {boolean} value
   */
  showStateLabels(value) {
    if (!this.map) {
      return;
    }
    this.map.setLayoutProperty(L.state.names, 'visibility', value ? 'visible' : 'none');
  }

  toggleStateLabels() {
    if (!this.map) {
      return;
    }
    this.showStateLabels(this.map.getLayoutProperty(L.state.names, 'visibility') !== 'visible');
  }
}
