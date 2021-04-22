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
    if (grid.width != null) {
      style += `grid-column-end: span ${grid.width}; `;
    }
    if (grid.height != null) {
      style += `grid-row-end: span ${grid.height}; `;
    }
    return style;
  }
</script>

<script>
  import arrowsAltIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrows-alt.svg';
  import timesCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/times-circle.svg';
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
   * @type {{width?: number; height?: number; x?: number; y?: number} | null}
   */
  export let grid = null;
</script>

<div class="widget-card uk-card uk-card-small uk-card-default" class:highlighted style={gridToStyle(grid)} data-id={id}>
  <div class="widget-wrapper">
    <div class="uk-card-body">
      <slot />
    </div>
  </div>
  <div class="uk-card-header widget-title">
    <div class="widget-move-handle">{@html arrowsAltIcon}</div>
    <button class="widget-close" type="button" on:click={() => dispatch('close', id)} title="Remove Widget">
      {@html timesCircleIcon}
    </button>
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
  .widget-close {
    line-height: 1;
    position: absolute;
    z-index: 1;
    top: 2px;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .widget-card:hover .widget-move-handle,
  .widget-card:hover .widget-close {
    opacity: 0.5;
  }
  .widget-move-handle:hover,
  .widget-close:hover {
    opacity: 1 !important;
  }

  .widget-move-handle {
    left: 2px;
    cursor: grab;
  }
  .widget-close {
    right: 2px;
    cursor: pointer;
    border: none;
    background: none;
  }

  .widget-move-handle > :global(svg),
  .widget-close > :global(svg) {
    width: 10px;
  }
</style>
