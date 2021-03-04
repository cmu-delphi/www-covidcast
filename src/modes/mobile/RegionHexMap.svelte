<script>
  import { isMobileDevice, stats } from '../../stores';
  import { state2TileCell } from '../../specs/matrixSpec';
  import { generateSparkLine } from '../../specs/lineSpec';
  import HexGrid from './components/HexGrid.svelte';
  import HexGridCell from './components/HexGridCell.svelte';
  import { getInfoByName, stateInfo } from '../../maps';
  import { addMissing } from '../../data';
  import { groupByRegion } from '../../stores/params';
  import Vega from '../../components/Vega.svelte';
  import SensorValue from './SensorValue.svelte';

  export let className = '';
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   */
  function loadData(sensor, date, isMobile) {
    const dateData = fetcher.fetch1SensorNRegions1Date(sensor, 'state', '*', date).then((rows) => groupByRegion(rows));
    const sparkLines = !isMobile
      ? fetcher
          .fetch1SensorNRegionsNDates(sensor, stateInfo, date.sparkLineTimeFrame, true)
          .then((rows) => groupByRegion(rows))
      : null;
    return state2TileCell.map((tile) => {
      const d = getInfoByName(tile.id);
      const value = dateData.then((lookup) => (lookup.get(d.propertyId) || [])[0]);
      const sparkLine = sparkLines
        ? sparkLines.then((lookup) => addMissing(lookup.get(d.propertyId) || [], sensor.value))
        : null;
      return {
        ...tile,
        ...d,
        region: d,
        sparkLine,
        value,
      };
    });
  }

  $: tileData = loadData(sensor, date, $isMobileDevice);
  $: spec = generateSparkLine({ highlightDate: false, domain: date.sparkLineTimeFrame.domain });
  $: colorScale = sensor.createColorScale($stats, region);

  const maxColumn = state2TileCell.reduce((acc, v) => Math.max(acc, v.x), 0) + 1;
</script>

<style>
  .title,
  .value {
    font-size: 0.65rem;
    line-height: 1;
  }

  .vega-wrapper {
    margin: 0 2px;
  }
  .root :global(.message-overlay)::after {
    padding: 0;
  }

  .root :global(.state-cell) {
    cursor: pointer;
  }

  .root :global(.state-cell:hover) {
    filter: drop-shadow(0 0 3px #ccc);
  }
  .root :global(.state-cell.selected) {
    filter: drop-shadow(0 0 3px #888);
  }
</style>

<div class="root {className}">
  <HexGrid columns={maxColumn} style="gap: 2px" className="vega-embed">
    {#each tileData as tile}
      {#await tile.value}
        <HexGridCell
          x={tile.x}
          y={tile.y}
          classNameOuter="state-cell {region.propertyId === tile.propertyId ? 'selected' : ''}"
          className="loading">
          <span class="title">{tile.propertyId}</span>
          <div class="vega-wrapper" />
          <span class="value"> ? </span>
        </HexGridCell>
      {:then v}
        <HexGridCell
          x={tile.x}
          y={tile.y}
          classNameOuter="state-cell {region.propertyId === tile.propertyId ? 'selected' : ''}"
          style="background-color: {colorScale(v ? v.value : null)};"
          on:click={() => region.set(tile.region)}>
          <span class="title">{tile.propertyId}</span>
          {#if !$isMobileDevice}
            <div class="vega-wrapper">
              <Vega {spec} data={tile.sparkLine} signals={{ currentDate: date.value }} noDataText="?" />
            </div>
          {/if}
          <span class="value"><SensorValue {sensor} value={v ? v.value : null} /></span>
        </HexGridCell>
      {/await}
    {/each}
  </HexGrid>
</div>
