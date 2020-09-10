import { L } from './layers';
import { LngLatBounds } from 'mapbox-gl';
import { bounds } from '../../maps';

export default class ZoomMap {
  constructor(onZoom) {
    /**
     * @type {import('mapbox-gl').Map | null}
     */
    this.map = null;
    this.onZoom = onZoom;
    this.stateBounds = new LngLatBounds(bounds.states);
    this.stateBoundsOptions = {
      padding: 20, //px
      linear: false,
    };
    this.stateZoom = 1;
    this.initialZoomView = true;
    this.zoneBounds = new LngLatBounds(bounds.zones);
    this.zoneBoundsOptions = {
      padding: 20, //px
      linear: false,
    };
  }

  _triggerZoom(paint) {
    // console.log(this.map.getZoom(), this.stateZoom, this.map.getZoom() / this.stateZoom);
    const z = this.map.getZoom() / this.stateZoom;
    this.onZoom(z, paint);
  }

  setMap(map) {
    this.map = map;

    this.stateZoom = this.map.getZoom();
    // console.log(this.stateZoom);
    this.map.on('zoom', () => {
      this._triggerZoom();
    });
  }

  ready() {
    this.stateZoom = this.map.getZoom();
    this._triggerZoom();
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
    this.map.fitBounds(this.stateBounds, this.stateBoundsOptions);
    this.map.once('idle', () => {
      this.stateZoom = this.map.getZoom();
      this._triggerZoom(true);
    });
  }

  resized() {
    if (!this.initialZoomView || !this.map) {
      return;
    }
    requestAnimationFrame(() => {
      this.map.fitBounds(this.stateBounds, this.stateBoundsOptions);
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

  showSWPA() {
    if (!this.map) {
      return;
    }
    this.initialZoomView = false;
    this.map.fitBounds(this.zoneBounds, this.zoneBoundsOptions);
    this.map.setLayoutProperty(L.zoneOutline, 'visibility', 'visible');
  }
}
