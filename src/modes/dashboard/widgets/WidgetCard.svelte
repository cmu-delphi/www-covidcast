<script context="module">
  function sensorToString(sensor) {
    if (!sensor) {
      return '?';
    }
    return typeof sensor === 'string' ? sensor : sensor.name;
  }
  function regionToString(region) {
    if (!region) {
      return '?';
    }
    return typeof region === 'string' ? region : region.displayName;
  }
  function dateToString(date) {
    if (!date) {
      return '?';
    }
    return typeof date === 'string'
      ? date
      : date instanceof TimeFrame
      ? `between ${formatDateLocal(date.min)} and ${formatDateLocal(date.max)}`
      : `on ${formatDateYearWeekdayAbbr(date.value)}`;
  }

  function gridToStyle(grid) {
    if (!grid) {
      return null;
    }
    let style = '';
    if (grid.x != null) {
      style += `grid-column-start: ${grid.x}; `;
    }
    if (grid.y != null) {
      style += `grid-row-start: ${grid.y}; `;
    }
    if (grid.width != null && grid.width > 1) {
      style += `grid-column-end: span ${grid.width}; `;
    }
    if (grid.height != null && grid.height > 1) {
      style += `grid-row-end: span ${grid.height}; `;
    }
    return style;
  }

  export const DEFAULT_WIDGET_STATE = { width: 1, height: 1 };
</script>

<script>
  import arrowsAltIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrows-alt.svg';
  import timesCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/times-circle.svg';
  import cogIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/cog.svg';
  import expandAltIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/expand-alt.svg';
  import compressAltIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/compress-alt.svg';
  import { formatDateLocal, formatDateYearWeekdayAbbr } from '../../../formats';
  import { TimeFrame } from '../../../stores/params';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").SensorParam | string}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").RegionParam | string}
   */
  export let region;
  /**
   * @type {import("../../../stores/params").DateParam | import("../../../stores/params").TimeFrame | string}
   */
  export let date;

  export let titleUnit = true;

  export let highlighted = false;

  /**
   * @type {'both' | 'x' | 'y'}
   */
  export let resizeMode = 'both';
  export let initialState = DEFAULT_WIDGET_STATE;

  let widgetSize = {
    width: (initialState || {}).width || 1,
    height: (initialState || {}).height || 1,
  };

  function shrink() {
    let width = widgetSize.width;
    let height = widgetSize.height;
    if (resizeMode === 'both' || resizeMode === 'x') {
      width = Math.max(1, width - 1);
    }
    if (resizeMode === 'both' || resizeMode === 'y') {
      height = Math.max(1, height - 1);
    }
    if (width !== widgetSize.width || height !== widgetSize.height) {
      widgetSize = { width, height };
      dispatch('state', widgetSize);
    }
  }
  function enlarge() {
    let width = widgetSize.width;
    let height = widgetSize.height;
    if (resizeMode === 'both' || resizeMode === 'x') {
      width = width + 1;
    }
    if (resizeMode === 'both' || resizeMode === 'y') {
      height = height + 1;
    }
    if (width !== widgetSize.width || height !== widgetSize.height) {
      widgetSize = { width, height };
      dispatch('state', widgetSize);
    }
  }
</script>

<div
  class="widget-card uk-card uk-card-small uk-card-default"
  class:highlighted
  style={gridToStyle(widgetSize)}
  data-id={id}
>
  <div class="widget-wrapper">
    <div class="uk-card-body">
      <slot />
    </div>
  </div>
  <div class="uk-card-header widget-title">
    <div class="widget-move-handle">{@html arrowsAltIcon}</div>
    <div class="widget-widget-toolbar">
      <button type="button" on:click={() => dispatch('action', { type: 'config', id })} title="Edit Widget">
        {@html cogIcon}
      </button>
      <button type="button" on:click={shrink} title="Shrink Widget">
        {@html compressAltIcon}
      </button>
      <button type="button" on:click={enlarge} title="Enlarge Widget">
        {@html expandAltIcon}
      </button>
      <button type="button" on:click={() => dispatch('action', { type: 'close', id })} title="Remove Widget">
        {@html timesCircleIcon}
      </button>
    </div>
    <div class="widget-toolbar">
      <slot name="toolbar" />
    </div>
    <h3>
      <slot name="title">
        {sensorToString(sensor)} in {regionToString(region)}
        <br />
        {dateToString(date)}
      </slot>
    </h3>
    {#if titleUnit && typeof sensor !== 'string'}
      <h4>{sensor.unit}</h4>
    {/if}
  </div>
</div>

<style>
  .widget-card {
    border-radius: 4px;
    display: flex;
    flex-direction: column;
  }

  .widget-wrapper {
    flex: 1 1 0;
    display: flex;
    position: relative;
    order: 2;
  }

  .uk-card-body {
    padding-top: 0;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    overflow: auto;

    display: flex;
  }

  .uk-card-body > :global(*) {
    flex: 1 1 0;
  }

  .widget-card.highlighted {
    box-shadow: 0 0 15px 0 #888;
  }

  .widget-title {
    position: relative;
    z-index: 1;
    background: white;
    padding-top: 20px;
  }

  .widget-title > h3 {
    margin: 0;
    font-size: 1rem;
  }

  .widget-title > h4 {
    margin: 0;
    font-size: 0.75rem;
  }

  .widget-toolbar {
    float: right;
  }

  .widget-toolbar :global(.uk-icon-button) {
    width: 24px;
    height: 24px;
  }

  .widget-move-handle,
  .widget-widget-toolbar {
    line-height: 1;
    position: absolute;
    z-index: 1;
    top: 2px;
    transition: opacity 0.25s ease;
  }
  .widget-move-handle,
  .widget-widget-toolbar > button {
    opacity: 0;
  }

  .widget-card:hover .widget-move-handle,
  .widget-card:hover .widget-widget-toolbar > button {
    opacity: 0.5;
  }
  .widget-move-handle:hover,
  .widget-widget-toolbar > button:hover {
    opacity: 1 !important;
  }

  .widget-move-handle {
    left: 4px;
    cursor: grab;
  }
  .widget-widget-toolbar {
    right: 4px;
  }
  .widget-widget-toolbar > button {
    cursor: pointer;
    padding: 0 2px;
    border: none;
    background: none;
  }

  .widget-move-handle > :global(svg),
  .widget-widget-toolbar > button > :global(svg) {
    width: 10px;
  }
</style>
