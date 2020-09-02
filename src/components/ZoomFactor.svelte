<script>
  import { zoom, zoomFactor, zoomMax, zoomMin, zoomMultiply } from '../stores';
</script>

<style>

</style>

<div>
  <div>
    <label for="zoom">Zoom Factor</label>
    <input id="zoom" type="number" readonly value={$zoom} step="*" />
  </div>
  <div>
    <label for="minZoom">Min Zoom Factor</label>
    <input id="minZoom" type="number" bind:value={$zoomMin} step="*" />
  </div>
  <div>
    <label for="maxZoom">Max Zoom Factor</label>
    <input id="maxZoom" type="number" bind:value={$zoomMax} step="*" />
  </div>
  <div>
    <label for="zoomFactor">Zoom Multiplier</label>
    <input id="zoomFactor" type="number" bind:value={$zoomFactor} step="*" />
  </div>
  <div>
    <label for="scaleFactor" title="multiplier * max(minZoom, min(maxZoom, zoom))">Spike Scale Factor</label>
    <input id="scaleFactor" type="number" readonly value={$zoomMultiply} step="*" />
  </div>
</div>
