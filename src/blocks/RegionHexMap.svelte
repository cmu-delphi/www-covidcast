<script>
  import { isMobileDevice } from '../stores';
  import { state2TileCell } from '../specs/matrixSpec';
  import { generateSparkLine } from '../specs/lineSpec';
  import HexGrid from '../components/HexGrid/HexGrid.svelte';
  import HexGridCell from '../components/HexGrid/HexGridCell.svelte';
  import { getInfoByName } from '../data/regions';
  import { addMissing } from '../data';
  import { groupByRegion } from '../stores/params';
  import Vega from '../components/vega/Vega.svelte';
  import SensorValue from '../components/SensorValue.svelte';
  import { MISSING_COLOR } from '../theme';
  import ColorLegend from '../components/HexGrid/ColorLegend.svelte';
  import DownloadMenu from '../components/DownloadMenu.svelte';
  import { formatDateISO } from '../formats';
  import { useWhiteTextColor } from '../util';
  import RegionMapTooltip from './RegionMapTooltip.svelte';

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
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  let loading = false;
  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   */
  function loadData(sensor, date, isMobile) {
    loading = true;
    const dateData = fetcher.fetch1SensorNRegions1Date(sensor, 'state', date).then((rows) => groupByRegion(rows));
    const sparkLines = !isMobile
      ? fetcher.fetch1SensorNRegionsNDates(sensor, 'state', date.sparkLineTimeFrame).then((rows) => groupByRegion(rows))
      : null;

    Promise.all([dateData, sparkLines]).then(() => {
      loading = false;
    });

    return state2TileCell.map((tile) => {
      const d = getInfoByName(tile.id, 'state');
      const value = dateData.then((lookup) => (lookup.get(d.propertyId) || [])[0]);
      const sparkLine = sparkLines
        ? sparkLines.then((lookup) =>
            addMissing(lookup.get(d.propertyId) || [], sensor.isWeeklySignal ? 'week' : 'day'),
          )
        : null;
      return {
        ...tile,
        ...d,
        region: d,
        sparkLine,
        value,
        dump:
          sparkLine ||
          value.then((vs) => ({
            ...d,
            ...(vs || {}),
          })),
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
  $: colorScale = sensor.createColorScale('state');
  $: dumpData = Promise.all(tileData.map((d) => d.dump)).then((rows) => rows.flat());

  const maxColumn = state2TileCell.reduce((acc, v) => Math.max(acc, v.x), 0) + 1;

  function isInvertedColor(v) {
    const color = v && v.value != null ? colorScale(v.value) : MISSING_COLOR;
    return useWhiteTextColor(color);
  }

  function style(v) {
    const color = v && v.value != null ? colorScale(v.value) : MISSING_COLOR;
    const white = useWhiteTextColor(color);
    return `background-color: ${color}${white ? '; color: white;' : ''}`;
  }
</script>

<div class="root {className}" class:loading>
  <HexGrid columns={maxColumn} style="gap: 2px; margin-bottom: 2rem;">
    {#each tileData as tile (tile.propertyId)}
      {#await tile.value}
        <HexGridCell
          x={tile.x}
          y={tile.y}
          classNameOuter="state-cell {region.propertyId === tile.propertyId ? 'selected' : ''}"
        >
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
          classNameOuter="state-cell {region.propertyId === tile.propertyId ? 'selected' : ''}"
          style={style(v)}
          on:click={() => region.set(tile.region, true)}
        >
          <span class="title">{tile.propertyId}</span>
          {#if !$isMobileDevice}
            <div class="vega-wrapper">
              <Vega
                spec={isInvertedColor(v) ? invertedSpec : spec}
                data={tile.sparkLine}
                signals={{ currentDate: date.value }}
                noDataText="N/A"
              />
            </div>
            <span class="value"><SensorValue {sensor} value={v ? v.value : null} /></span>
          {/if}
          <div slot="tooltip" class="hex-tooltip viz-tooltip">
            <RegionMapTooltip {sensor} item={{ ...tile.region, ...v }} />
          </div>
        </HexGridCell>
      {/await}
    {/each}
  </HexGrid>
  <div class="bottom-bar">
    <div style="display:{$isMobileDevice ? 'none' : 'auto'}">Dashed vertical lines: month boundaries</div>
    <div style="display:{$isMobileDevice ? 'none' : 'auto'}; margin-bottom: 0.5em">
      Red vertical line: selected date
    </div>
    <div>Hex fill color: value at selected date</div>
  </div>
  <ColorLegend {sensor} level="state" gradientLength={$isMobileDevice ? 250 : 280}>
    <DownloadMenu fileName="{sensor.name}_US_States_{formatDateISO(date.value)}" data={dumpData} absolutePos {sensor} />
  </ColorLegend>
</div>

<style>
  .bottom-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 0.5em;
    position: relative;
  }

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

  .root :global(.viz-tooltip) {
    bottom: 150%;
    right: 0;
    position: absolute;
    display: none;
    min-width: 10em;
    white-space: nowrap;
  }
  .root :global(.state-cell:hover .viz-tooltip) {
    display: block;
  }
</style>
