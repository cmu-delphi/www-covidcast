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
  import { MISSING_COLOR } from '../../theme';
  import ColorLegend from './components/ColorLegend.svelte';
  import { hsl } from 'd3-color';

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

  let loading = false;
  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   */
  function loadData(sensor, date, isMobile) {
    loading = true;
    const dateData = fetcher.fetch1SensorNRegions1Date(sensor, 'state', '*', date).then((rows) => groupByRegion(rows));
    const sparkLines = !isMobile
      ? fetcher
          .fetch1SensorNRegionsNDates(sensor, stateInfo, date.sparkLineTimeFrame, true)
          .then((rows) => groupByRegion(rows))
      : null;

    Promise.all([dateData, sparkLines]).then(() => {
      loading = false;
    });

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
  $: spec = generateSparkLine({
    highlightDate: false,
    interactive: false,
    domain: date.sparkLineTimeFrame.domain,
  });
  $: invertedSpec = generateSparkLine({
    color: 'white',
    highlightDate: false,
    interactive: false,
    domain: date.sparkLineTimeFrame.domain,
  });
  $: colorScale = sensor.createColorScale($stats, region.level);

  const maxColumn = state2TileCell.reduce((acc, v) => Math.max(acc, v.x), 0) + 1;

  function isInvertedColor(v) {
    const color = v && v.value != null ? colorScale(v.value) : MISSING_COLOR;
    return hsl(color).l < 0.5;
  }

  function style(v) {
    const color = v && v.value != null ? colorScale(v.value) : MISSING_COLOR;
    const white = hsl(color).l < 0.5;
    return `background-color: ${color}${white ? '; color: white;' : ''}`;
  }
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
  .vega-wrapper :global(.message-overlay)::after {
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

<div class="root {className}" class:loading>
  <HexGrid columns={maxColumn} style="gap: 2px; margin-bottom: 2rem;">
    {#each tileData as tile}
      {#await tile.value}
        <HexGridCell
          x={tile.x}
          y={tile.y}
          classNameOuter="state-cell {region.propertyId === tile.propertyId ? 'selected' : ''}">
          <span class="title">{tile.propertyId}</span>
          {#if !$isMobileDevice}
            <div class="vega-wrapper" />
            <span class="value"> ? </span>
          {/if}
        </HexGridCell>
      {:then v}
        <HexGridCell
          x={tile.x}
          y={tile.y}
          tooltip={v && v != null ? `${sensor.formatValue(v.value)} ${sensor.unitHTML}` : 'N/A'}
          classNameOuter="state-cell {region.propertyId === tile.propertyId ? 'selected' : ''}"
          style={style(v)}
          on:click={() => region.set(tile.region, true)}>
          <span class="title">{tile.propertyId}</span>
          {#if !$isMobileDevice}
            <div class="vega-wrapper">
              <Vega
                spec={isInvertedColor(v) ? invertedSpec : spec}
                data={tile.sparkLine}
                signals={{ currentDate: date.value }}
                noDataText="N/A" />
            </div>
            <span class="value"><SensorValue {sensor} value={v ? v.value : null} /></span>
          {/if}
        </HexGridCell>
      {/await}
    {/each}
  </HexGrid>
  <ColorLegend {sensor} level="state" />
</div>
