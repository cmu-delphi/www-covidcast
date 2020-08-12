import { Popup } from 'mapbox-gl';
import { levelMegaCounty, levels } from '../../stores/constants';
import { generateTooltip } from './generateTooltip';
import { L } from './layers';
import { S } from './sources';

export default class InteractiveMap {
  /**
   * @param {import('mapbox-gl').Map} map
   * @param {{readonly encoding: string, readonly level: string, dispatch(type: string, detail: any)}} adapter
   */
  constructor(map, adapter) {
    this.adapter = adapter;
    this.map = map;
    this.popup = new Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-popup',
    });
    this.topPopup = new Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-popup',
      anchor: 'top',
    });
    this.clicked = {
      id: null,
      mega: null,
    };
    this.hovered = {
      id: null,
      mega: null,
    };

    this.initListeners();
  }

  initListeners() {
    this.map.on('mouseleave', L.state.stroke, this._onMapMouseLeave.bind(this));
    this.map.on('mousemove', L.state.stroke, this._onMapMouseMove.bind(this));

    levels.forEach((level) => {
      this.map.on('mouseenter', L[level].fill, this._onLevelMouseEnter.bind(this));
      this.map.on('mouseleave', L[level].fill, this._onLevelMouseLeave.bind(this));
      this.map.on('mousemove', L[level].fill, this._onLevelMouseMove.bind(this));
      this.map.on('click', L[level].fill, this._onLevelMouseClick.bind(this));
    });
    this.map.on('mouseenter', L[levelMegaCounty.id].fill, this._onLevelMouseEnter.bind(this));
    this.map.on('mouseleave', L[levelMegaCounty.id].fill, this._onLevelMouseLeave.bind(this));
    this.map.on('mousemove', L[levelMegaCounty.id].fill, this._onMegaMouseMove.bind(this));
    this.map.on('click', L[levelMegaCounty.id].fill, this._onMegaMouseClick.bind(this));
  }

  get activePopup() {
    return this.adapter.encoding.id === 'spike' ? this.topPopup : this.popup;
  }
  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onLevelMouseEnter(e) {
    this.map.getCanvas().style.cursor = 'pointer';
    this.activePopup.setLngLat(e.lngLat).addTo(this.map);

    this._updateHighlight(this.hovered, null, null);
  }

  _onLevelMouseLeave() {
    this.map.getCanvas().style.cursor = '';
    this.popup.remove();
    this.topPopup.remove();
    this._updateHighlight(this.hovered, null, null);
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onLevelMouseClick(e) {
    const feature = e.features[0];
    const nextValue = this.clicked.id === feature.id ? null : feature.id;
    this.adapter.dispatch('select', nextValue ? feature : null);
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onMegaMouseClick(e) {
    if (this.hovered.id !== null) {
      return;
    }
    if (this.hovered.mega === this.clicked.mega) {
      // reset
      this.adapter.dispatch('selectMega', null);
      return;
    }
    const feature = e.features[0];
    this.adapter.dispatch('selectMega', feature);
  }

  _onMapMouseLeave() {
    this.map.getCanvas().style.cursor = 'pointer';
    this.activePopup.remove();
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onMapMouseMove(e) {
    this.map.getCanvas().style.cursor = 'pointer';
    const feature = e.features[0];
    this.activePopup
      .setLngLat(e.lngLat)
      .setHTML(`Estimate unavailable for rest of ${feature.properties.displayName}`)
      .addTo(this.map);
  }
  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onMegaMouseMove(e) {
    this.map.getCanvas().style.cursor = 'pointer';
    const feature = e.features[0];

    if (this.hovered.id !== null) {
      this._updateHighlight(this.hovered, this.hovered.id, null);
      return;
    }
    this._updateHighlight(this.hovered, null, feature.id);

    this.activePopup.setLngLat(e.lngLat).setHTML(generateTooltip(feature)).addTo(this.map);
  }
  /**
   * @param {'state' | 'county' | 'metro-area'} level
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onLevelMouseMove(e) {
    this.map.getCanvas().style.cursor = 'pointer';
    const feature = e.features[0];
    // The hovered element is not a mega county. It can be county, msa, state, bubble, or spike.

    this._updateHighlight(this.hovered, feature.id, null);

    this.activePopup.setLngLat(e.lngLat).setHTML(generateTooltip(feature)).addTo(this.map);
  }

  /**
   * @param {string[]} sources
   * @param {string} id
   * @param {{ [key: string]: any;}} state
   */
  _setFeatureStateMultiple(sources, id, state) {
    if (!this.map) {
      return;
    }
    sources.forEach((source) => {
      if (!this.map.getSource(source)) {
        throw `source ${source} does not exist`;
      }
      this.map.setFeatureState({ source, id }, state);
    });
  }

  /**
   *
   * @param {{id: string | null, mega: string | null}} obj
   * @param {string | null} id
   * @param {string | null} mega
   */
  _updateHighlight(obj, id = null, mega = null) {
    const attr = obj === this.clicked ? 'select' : 'hover';
    const setState = { [attr]: true };
    const clearState = { [attr]: false };

    // match ids
    if (obj.id !== id) {
      const layers = [S[this.adapter.level].border, S.bubble, S.spike.fill, S.spike.stroke];
      if (obj.id) {
        this._setFeatureStateMultiple(layers, obj.id, clearState);
      }
      if (id) {
        this._setFeatureStateMultiple(layers, id, setState);
      }
      obj.id = id;
    }

    // match mega
    if (obj.mega !== mega) {
      if (obj.mega) {
        this.map.setFeatureState({ source: S[levelMegaCounty.id].border, id: obj.mega }, clearState);
      }
      if (mega) {
        this.map.setFeatureState({ source: S[levelMegaCounty.id].border, id: mega }, setState);
      }
      obj.mega = mega;
    }
  }

  /**
   *
   * @param {import('../../maps/nameIdInfo').NameInfo | null} selection
   */
  select(selection) {
    const bak = Object.assign({}, this.clicked);
    const id = selection != null && selection.level !== levelMegaCounty.id ? Number(selection.id) : null;
    const megaId = selection != null && selection.level === levelMegaCounty.id ? Number(selection.id) : null;
    this._updateHighlight(this.clicked, id, megaId);
    return bak;
  }

  forceHover(feature) {
    this._updateHighlight(this.hovered, feature.id, null);
  }
}
