<script>
  import { downloadUrl } from '../../../util';
  import { csvFormat } from 'd3-dsv';
  import { formatDateISO } from '../../../formats';

  export let fileName = 'chart';
  /**
   * @type {import('../../../components/Vega.svelte').default}
   */
  export let vegaRef = null;

  export let data = null;

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor = null;

  export let raw = false;

  export let absolutePos = false;

  // TODO how about title, credits ->

  function downloadString(string, mimeType, extension) {
    const blob = new Blob([string], {
      type: mimeType,
    });
    const url = URL.createObjectURL(blob);
    downloadUrl(url, `COVIDcast_${fileName}.${extension}`);
    URL.revokeObjectURL(url);
  }

  function downloadSVG() {
    if (!vegaRef) {
      return;
    }
    vegaRef
      .vegaAccessor()
      .then(/** @param {import('vega-typings').View} view */ (view) => view.toSVG(2))
      .then((svgString) => {
        downloadString(svgString, 'image/svg+xml', 'svg');
      });
  }
  function downloadPNG() {
    if (!vegaRef) {
      return;
    }
    vegaRef
      .vegaAccessor()
      .then(
        /** @param {import('vega-typings').View} view */
        (view) => view.toImageURL('png', 2),
      )
      .then((url) => {
        downloadUrl(url, `COVIDcast_${fileName}.png`);
      });
  }
  function defaultPrepareRow(row) {
    const r = {};
    if (sensor) {
      r.indicatorDataSource = sensor.value.id;
      r.indicatorId = sensor.value.signal;
      r.indicatorName = sensor.name;
    }
    r.regionId = row.propertyId;
    r.regionLevel = row.level;
    r.regionName = row.displayName;
    r.date = formatDateISO(row.date_value);
    r.value = row.value;
    if (raw) {
      r.raw = row.raw;
    }
    return r;
  }

  export let prepareRow = defaultPrepareRow;

  function prepareData(rows) {
    return rows.map(prepareRow);
  }

  function downloadCSV() {
    if (!data) {
      return;
    }
    Promise.resolve(data)
      .then(prepareData)
      .then((rows) => {
        const columns = Object.keys(rows[0] || {});
        const csv = csvFormat(rows, columns);
        downloadString(csv, 'text/csv', 'csv');
      });
  }
  function downloadJSON() {
    if (!data) {
      return;
    }
    Promise.resolve(data)
      .then(prepareData)
      .then((rows) => {
        downloadString(JSON.stringify(rows, null, 2), 'application/json', 'json');
      });
  }
</script>

{#if vegaRef || data}
  <button class="uk-icon-button" class:absolutePos type="button" uk-icon="download" />
  <div data-uk-dropdown="pos: bottom-right">
    <ul class="uk-nav uk-dropdown-nav">
      {#if vegaRef}
        <li class="uk-nav-header">Download Chart</li>
        <li><a href="?" on:click|preventDefault={downloadSVG}>Save as SVG</a></li>
        <li><a href="?" on:click|preventDefault={downloadPNG}>Save as PNG</a></li>
      {/if}
      {#if data}
        <li class="uk-nav-header">Download Data</li>
        <li><a href="?" on:click|preventDefault={downloadJSON}>Save as JSON</a></li>
        <li><a href="?" on:click|preventDefault={downloadCSV}>Save as CSV</a></li>
      {/if}
    </ul>
  </div>
{/if}

<style>
  .absolutePos {
    position: absolute;
    right: 0;
    bottom: 2px;
    z-index: 1;
  }
</style>
