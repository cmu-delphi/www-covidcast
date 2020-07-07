<script>
  import Graph from './Graph.svelte';
  import { mapFirstLoaded } from '../stores.js';

  export let isIE, graphShowStatus, toggleGraphShowStatus;
</script>

<style>
  .graph-container {
    position: absolute;
    z-index: 1001;
    bottom: 124px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 5px 5px;
    box-sizing: border-box;
    transition: opacity 0.3s ease-in-out;
    visibility: hidden;
    opacity: 0;
  }

  .graph-container.show {
    visibility: visible;
    opacity: 1;
  }

  .hide-graph-button-anchor {
    position: relative;
  }

  .hide-graph-button {
    position: absolute;
    top: 0;
    left: 0;
    width: 14px;
    height: 14px;
    color: #333;
    font-size: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    background-color: transparent;
    padding: 0;
    border: 0;
    transition: opacity 0.1s ease-in;
    opacity: 0.7;
  }

  .hide-graph-button:hover {
    opacity: 1;
  }

  .graph-toggole-button-container {
    position: absolute;
    float: right;
    z-index: 1001;
    bottom: 124px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 5px 5px;
    box-sizing: border-box;
  }

  .graph-toggle-button {
    font-family: 'Open Sans', sans-serif;
    width: 85px;
    height: 40px;
    font-size: 14px;
    cursor: pointer;
    color: #333;
    background-color: transparent;
    padding: 0;
    border: 0;
    transition: all 0.1s ease-in;
    position: relative;
  }

  .graph-toggle-button:hover {
    background-color: #eee;
  }

  button.graph-toggle-button .button-tooltip {
    visibility: hidden;
    width: 120px;
    border-style: solid;
    border-width: 1px;
    border-color: #666;
    background-color: #fff;
    color: #333;
    font-weight: 400;
    font-size: 14px;
    line-height: 14px;
    text-align: center;
    border-radius: 6px;
    padding: 5px 5px;
    position: absolute;
    z-index: 1;
    top: 0px;
    right: 120%;
  }

  button.graph-toggle-button .button-tooltip::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent transparent #666;
  }

  button.graph-toggle-button:hover .button-tooltip {
    visibility: visible;
  }
</style>

{#if $mapFirstLoaded && !graphShowStatus}
  <div class="graph-toggole-button-container">
    <button
      title={isIE !== undefined ? 'Show time series' : ''}
      class="graph-toggle-button"
      aria-label="show time series"
      on:click={event => toggleGraphShowStatus(false)}>
      <span class="button-tooltip">Show time series</span>
      <b>View Time Graph</b>
    </button>
  </div>
{/if}

<div class="graph-container {$mapFirstLoaded && graphShowStatus ? 'show' : ''}">
  <div class="hide-graph-button-anchor">
    <button
      title="Hide time series"
      aria-label="Hide time series"
      on:click={toggleGraphShowStatus}
      class="hide-graph-button">
      &#10005;
    </button>
  </div>

  <Graph />
</div>
