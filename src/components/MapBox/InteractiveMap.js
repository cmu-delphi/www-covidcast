import { Popup } from 'mapbox-gl';
import { levelMegaCounty, levels, levelsWithMega } from '../../stores/constants';
import { L } from './layers';
import { S } from './sources';
import Tooltip from './Tooltip.svelte';

export default class InteractiveMap {
  /**
   * @param {import('mapbox-gl').Map} map
   * @param {{readonly encoding: string, readonly level: string, dispatch(type: string, detail: any)}} adapter
   */
  constructor(map, adapter) {
    this.adapter = adapter;
    this.map = map;
    this.data = new Map();

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
      level: null,
      mega: null,
    };
    this.hovered = {
      id: null,
      level: null,
      mega: null,
    };

    this.tooltipElement = document.createElement('div');
    this.tooltip = new Tooltip({
      target: this.tooltipElement,
      props: {
        properties: null,
        invalid: true,
      },
    });

    this.initListeners();
  }

  initListeners() {
    this.map.on('mouseenter', L.state.stroke, this._onMapMouseEnter.bind(this));
    this.map.on('mouseleave', L.state.stroke, this._onMapMouseLeave.bind(this));
    this.map.on('mousemove', L.state.stroke, this._onMapMouseMove.bind(this));

    levels.forEach((level) => {
      // this.map.on('mouseenter', L[level].fill, this._onLevelMouseEnter.bind(this));
      this.map.on('mouseleave', L[level].fill, this._onLevelMouseLeave.bind(this));
      this.map.on('mousemove', L[level].fill, this._onLevelMouseMove.bind(this));
      this.map.on('click', L[level].fill, this._onLevelMouseClick.bind(this));
    });
    // this.map.on('mouseenter', L[levelMegaCounty.id].fill, this._onMegaMouseEnter.bind(this));
    this.map.on('mouseleave', L[levelMegaCounty.id].fill, this._onMegaMouseLeave.bind(this));
    this.map.on('mousemove', L[levelMegaCounty.id].fill, this._onMegaMouseMove.bind(this));
    this.map.on('click', L[levelMegaCounty.id].fill, this._onMegaMouseClick.bind(this));
  }

  get activePopup() {
    return this.adapter.encoding.id === 'spike' ? this.topPopup : this.popup;
  }

  _onMapMouseEnter() {
    this.map.getCanvas().style.cursor = 'pointer';
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onLevelMouseLeave() {
    this.map.getCanvas().style.cursor = '';
    this.activePopup.remove();
    this._updateHighlight(this.hovered, null, null);
  }
  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onMegaMouseLeave() {
    this.map.getCanvas().style.cursor = '';
    this.activePopup.remove();
    this._updateHighlight(this.hovered, null, null);
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onMapMouseLeave() {
    this.map.getCanvas().style.cursor = '';
    this.activePopup.remove();
  }

  /**
   * @param {'state' | 'county' | 'metro-area'} level
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onLevelMouseMove(e) {
    const feature = e.features[0];
    if (this.adapter.isMissing(feature)) {
      return;
    }
    // mark handled
    e.preventDefault();
    this._updateHighlight(this.hovered, feature.id, null, feature.properties.level);
    this._renderTooltip(e);
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onMegaMouseMove(e) {
    if (e.defaultPrevented) {
      // already handled
      return;
    }
    const feature = e.features[0];
    if (this.adapter.isMissing(feature)) {
      return;
    }

    // mark handled
    e.preventDefault();
    this._updateHighlight(this.hovered, null, feature.id);
    this._renderTooltip(e);
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onMapMouseMove(e) {
    if (e.defaultPrevented) {
      // already handled
      return;
    }
    this._renderTooltip(e, true);
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onLevelMouseClick(e) {
    const feature = e.features[0];
    if (this.adapter.isMissing(feature)) {
      return;
    }
    e.preventDefault(); // mark handled
    const nextValue = this.clicked.id === feature.id ? null : feature.id;
    this.adapter.dispatch('select', nextValue ? feature : null);
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onMegaMouseClick(e) {
    if (e.defaultPrevented) {
      // already handled
      return;
    }
    const feature = e.features[0];
    if (this.adapter.isMissing(feature)) {
      return;
    }
    e.preventDefault(); // mark handled
    const nextValue = this.clicked.mega === feature.id ? null : feature.id;
    this.adapter.dispatch('select', nextValue ? feature : null);
  }

  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _renderTooltip(e, invalid = false) {
    this.map.getCanvas().style.cursor = 'pointer';
    const feature = e.features[0];
    const popup = this.activePopup;
    this.tooltip.$set({
      properties: {
        ...feature.properties,
        ...(this.data.get(feature.properties.id) || {}),
      },
      invalid,
    });
    popup.setLngLat(e.lngLat).setDOMContent(this.tooltipElement).addTo(this.map);
  }

  _updateState(source, id, state) {
    this.map.setFeatureState(
      {
        source,
        id: typeof id === 'string' ? Number.parseInt(id, 10) : id,
      },
      state,
    );
  }

  _updateHoverLayerVisibility() {
    const visibleLevels = new Set();
    if (this.clicked.mega != null || this.hovered.mega != null) {
      visibleLevels.add(levelMegaCounty.id);
    }
    if (this.clicked.id != null) {
      visibleLevels.add(this.clicked.level);
    }
    if (this.hovered.id != null) {
      visibleLevels.add(this.hovered.level);
    }
    for (const level of levelsWithMega) {
      const visible = this.map.getLayoutProperty(L[level].hover, 'visibility') !== 'none';
      if (visible !== visibleLevels.has(level)) {
        this.map.setLayoutProperty(L[level].hover, 'visibility', visibleLevels.has(level) ? 'visible' : 'none');
      }
    }
  }

  /**
   *
   * @param {{id: string | null, mega: string | null}} obj
   * @param {string | null} id
   * @param {string | null} mega
   */
  _updateHighlight(obj, id = null, mega = null, level = this.adapter.level) {
    const attr = obj === this.clicked ? 'select' : 'hover';
    const setState = { [attr]: true };
    const clearState = { [attr]: false };

    // match ids
    if (obj.id !== id) {
      if (obj.id) {
        this._updateState(S[obj.level].border, obj.id, clearState);
      }
      if (id) {
        this._updateState(S[level].border, id, setState);
      }
      obj.id = id;
      // store level of selected id
      obj.level = level;
    }

    // match mega
    if (obj.mega !== mega) {
      if (obj.mega) {
        this._updateState(S[levelMegaCounty.id].border, obj.mega, clearState);
      }
      if (mega) {
        this._updateState(S[levelMegaCounty.id].border, mega, setState);
      }
      obj.mega = mega;
    }
    this._updateHoverLayerVisibility();
  }

  /**
   *
   * @param {import('../../maps/nameIdInfo').NameInfo | null} selection
   */
  select(selection) {
    const bak = Object.assign({}, this.clicked);
    const id = selection != null && selection.level !== levelMegaCounty.id ? Number(selection.id) : null;
    const megaId = selection != null && selection.level === levelMegaCounty.id ? Number(selection.id) : null;
    this._updateHighlight(this.clicked, id, megaId, selection != null ? selection.level : this.adapter.level);
    return bak;
  }

  forceHover(feature) {
    this._updateHighlight(this.hovered, feature.id, null, feature.properties.level);
  }
}
