import { L } from './layers';
import bbox from '@turf/bbox';

let SHRINK_FACTOR = 0.75;

export default class ZoomMap {
  constructor(onZoom, bounds) {
    /**
     * @type {import('mapbox-gl').Map | null}
     */
    this.map = null;
    this.onZoom = onZoom;
    this.resetBounds = bounds;
    this.resetBoundsOptions = {
      padding: 30, //px
      linear: false,
    };
    this.stateZoom = 1;
    this.initialZoomView = true;
  }

  _triggerZoom(paint) {
    // console.log(this.map.getZoom(), this.stateZoom, this.map.getZoom() / this.stateZoom);
    const current = this.map.getZoom();
    const base = this.stateZoom;

    const zoom = Math.pow(2, (current - base) * SHRINK_FACTOR);
    this.onZoom(zoom, paint);
  }

  setMap(map) {
    this.map = map;

    this.stateZoom = this.map.getZoom();
    this.map.setMinZoom(this.stateZoom - 1); // limit zoom to one level above the us
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

  focusOn(feature) {
    if (!feature || !this.map) {
      return;
    }
    this.initialZoomView = false;

    const bounds = bbox(feature);
    this.map.fitBounds(bounds, {
      maxZoom: this.getZoom() * 1.5,
      linear: false,
      essential: true,
    });
  }

  resetZoom() {
    if (!this.map) {
      return;
    }
    this.initialZoomView = true;
    this.map.fitBounds(this.resetBounds, this.resetBoundsOptions);
    this.map.once('idle', () => {
      this.stateZoom = this.map.getZoom();
      this.map.setMinZoom(this.stateZoom - 1); // limit zoom to one level above the us
      this._triggerZoom(true);
    });
  }

  resized() {
    if (!this.initialZoomView || !this.map) {
      return;
    }
    requestAnimationFrame(() => {
      if (this.map) {
        this.map.fitBounds(this.resetBounds, this.resetBoundsOptions);
      }
    });
  }

  /**
   * @param {boolean} value
   */
  showStateLabels(value) {
    if (!this.map || !this.map.getLayer(L.stateNames)) {
      return;
    }
    this.map.setLayoutProperty(L.stateNames, 'visibility', value ? 'visible' : 'none');
  }

  toggleStateLabels() {
    if (!this.map || !this.map.getLayer(L.stateNames)) {
      return;
    }
    this.showStateLabels(this.map.getLayoutProperty(L.stateNames, 'visibility') !== 'visible');
  }
}
