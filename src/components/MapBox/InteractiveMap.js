import { Popup } from 'mapbox-gl';
import { levelMegaCounty } from '../../stores/constants';
import { L, toFillLayer, toHoverLayer } from './layers';
import { toBorderSource } from './sources';
import Tooltip from './Tooltip.svelte';
import { MAP_THEME } from '../../theme';

export default class InteractiveMap {
  /**
   * @param {import('mapbox-gl').Map} map
   * @param {{readonly encoding: string, readonly level: string, readonly levels: string[], hasMegaCountyLevel: boolean, dispatch(type: string, detail: any)}} adapter
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
    /**
     * @type {{id: string, level: string, color: string}[]}
     */
    this.selection = [];
    this.hovered = {
      id: null,
      level: null,
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
    this.map.on('mouseenter', L.outline, this._onMapMouseEnter.bind(this));
    this.map.on('mouseleave', L.outline, this._onMapMouseLeave.bind(this));
    this.map.on('mousemove', L.outline, this._onMapMouseMove.bind(this));

    this.adapter.levels.forEach((level) => {
      const fillLayer = toFillLayer(level);
      // this.map.on('mouseenter', fillLayer, this._onLevelMouseEnter.bind(this));
      this.map.on('mouseleave', fillLayer, this._onLevelMouseLeave.bind(this));
      this.map.on('mousemove', fillLayer, this._onLevelMouseMove.bind(this));
      this.map.on('click', fillLayer, this._onLevelMouseClick.bind(this));
    });
    if (this.adapter.hasMegaCountyLevel) {
      const fillLayer = toFillLayer(levelMegaCounty.id);
      // this.map.on('mouseenter', fillLayer, this._onMegaMouseEnter.bind(this));
      this.map.on('mouseleave', fillLayer, this._onMegaMouseLeave.bind(this));
      this.map.on('mousemove', fillLayer, this._onMegaMouseMove.bind(this));
      this.map.on('click', fillLayer, this._onMegaMouseClick.bind(this));
    }
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
    this._updateHoverHighlight(null);
  }
  /**
   * @param {import('mapbox-gl').MapMouseEvent} e
   */
  _onMegaMouseLeave() {
    this.map.getCanvas().style.cursor = '';
    this.activePopup.remove();
    this._updateHoverHighlight(null);
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
    this._updateHoverHighlight(feature.id, feature.properties.level);
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
    this._updateHoverHighlight(feature.id, feature.properties.level);
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
    this.adapter.dispatch('select', { feature, originalEvent: e.originalEvent });
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
    this.adapter.dispatch('select', { feature, originalEvent: e.originalEvent });
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
    const visibleLevels = new Set(this.selection.map((d) => d.level));
    if (this.hovered.id != null) {
      visibleLevels.add(this.hovered.level);
    }
    const updateLevel = (level) => {
      const visible = this.map.getLayoutProperty(toHoverLayer(level), 'visibility') !== 'none';
      if (visible !== visibleLevels.has(level)) {
        this.map.setLayoutProperty(toHoverLayer(level), 'visibility', visibleLevels.has(level) ? 'visible' : 'none');
      }
    };
    for (const level of this.adapter.levels) {
      updateLevel(level);
    }
    if (this.adapter.hasMegaCountyLevel) {
      updateLevel(levelMegaCounty.id);
    }
  }

  /**
   *
   * @param {{id: string | null, mega: string | null}} obj
   * @param {string | null} id
   * @param {string | null} mega
   */
  _updateHoverHighlight(id = null, level = null) {
    if (this.hovered.id == id) {
      return;
    }
    // match ids
    if (this.hovered.id) {
      this._updateState(toBorderSource(this.hovered.level), this.hovered.id, { hover: false });
    }
    if (id) {
      this._updateState(toBorderSource(level), id, { hover: true });
    }
    this.hovered.id = id;
    this.hovered.level = level;
    this._updateHoverLayerVisibility();
  }

  /**
   * @param {import('../../maps/nameIdInfo').NameInfo | null} selection
   */
  select(selection) {
    return this.selectMulti(selection ? [{ info: selection, color: MAP_THEME.selectedRegionOutline }] : [])[0];
  }

  /**
   * @param {{info: import('../../maps/nameIdInfo').NameInfo, color: string}[]} selections
   */
  selectMulti(selections) {
    const bak = this.selection.slice();

    for (const old of this.selection) {
      this._updateState(toBorderSource(old.level), old.id, { select: false });
    }

    this.selection = selections.map((s) => {
      const id = Number(s.info.id);
      this._updateState(toBorderSource(s.info.level), id, { select: s.color });
      return {
        id,
        level: s.info.level,
        color: s.color,
      };
    });

    this._updateHoverLayerVisibility();
    return bak;
  }

  forceHover(feature) {
    this._updateHoverHighlight(feature.id, feature.properties.level);
  }

  /**
   * @param {import('../../maps/nameIdInfo').NameInfo | null} selection
   */
  isHovered(selection) {
    if (!selection) {
      return false;
    }
    // == on purpose
    return selection.id == this.hovered.id && selection.level === this.hovered.level;
  }
}
