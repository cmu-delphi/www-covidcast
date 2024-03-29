<script context="module">
  const DEFAULT_STATE = {
    ...DEFAULT_WIDGET_STATE,
    width: 2,
    height: 2,
  };
</script>

<script>
  import WidgetCard, { DEFAULT_WIDGET_STATE } from './WidgetCard.svelte';
  import { getContext } from 'svelte';
  import DownloadMenu from '../../../components/DownloadMenu.svelte';
  import { formatDateISO, formatWeek } from '../../../formats';
  import { useWhiteTextColor } from '../../../util';
  import { getInfoByName } from '../../../data/regions';
  import { state2TileCell } from '../../../specs/matrixSpec';
  import HexGrid from '../../../components/HexGrid/HexGrid.svelte';
  import HexGridCell from '../../../components/HexGrid/HexGridCell.svelte';
  import ColorLegend from '../../../components/HexGrid/ColorLegend.svelte';
  import { MISSING_COLOR } from '../../../theme';
  import { groupByRegion } from '../../../stores/params';
  import { WidgetHighlight } from '../highlight';

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  export let initialState = DEFAULT_STATE;

  /**
   * @type {import("../../../stores/DataFetcher").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").DateParam} date
   */
  function generateFileName(sensor, date) {
    return `${sensor.name}_US_States_${sensor.isWeeklySignal ? formatWeek(date.week) : formatDateISO(date.value)}`;
  }

  let loading = false;

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").DateParam} date
   */
  function loadData(sensor, date) {
    loading = true;
    return fetcher.fetch1SensorNRegions1Date(sensor, 'state', date).then((rows) => {
      loading = false;
      const lookup = groupByRegion(rows);
      return state2TileCell.map((tile) => {
        const d = getInfoByName(tile.id, 'state');
        const value = (lookup.get(d.propertyId) || [])[0];
        return {
          ...tile,
          region: d,
          value,
          dump: {
            ...d,
            ...(value || {}),
          },
          highlight: new WidgetHighlight(sensor.value, d, sensor.isWeeklySignal ? date.week : date.value),
        };
      });
    });
  }

  $: tileData = loadData(sensor, date);
  $: colorScale = sensor.createColorScale('state');

  const maxColumn = state2TileCell.reduce((acc, v) => Math.max(acc, v.x), 0) + 1;
  // const maxRow = state2TileCell.reduce((acc, v) => Math.max(acc, v.y), 0) + 1;

  function style(v) {
    const color = v && v.value != null ? colorScale(v.value) : MISSING_COLOR;
    const white = useWhiteTextColor(color);
    return `background-color: ${color}${white ? '; color: white;' : ''}`;
  }

  $: fileName = generateFileName(sensor, date);

  $: highlighted =
    highlight != null && highlight.matches(sensor.value, 'state', sensor.isWeeklySignal ? date.week : date.value);

  function isSelected(tile, sensor, date, highlight) {
    if (!highlight) {
      return false;
    }
    return highlight.matches(sensor.value, tile.region, sensor.isWeeklySignal ? date.week : date.value);
  }

  function resolveHighligtedValue(highlight, tileData, sensor, date) {
    return tileData.then((tiles) => {
      if (!highlight || !highlight.matches(sensor.value, 'state', sensor.isWeeklySignal ? date.week : date.value)) {
        return null;
      }
      const highlightedTile = tiles.find((tile) => isSelected(tile, sensor, date, highlight));
      return highlightedTile != null && highlightedTile.value != null ? highlightedTile.value.value : null;
    });
  }

  $: highlightedValue = resolveHighligtedValue(highlight, tileData, sensor, date);

  function onMouseEnter(tile) {
    if (!tile.highlight.equals(highlight)) {
      highlight = tile.highlight;
    }
  }
  function onMouseLeave() {
    highlight = null;
  }
</script>

<WidgetCard
  {sensor}
  region="US States"
  {date}
  {id}
  {initialState}
  defaultState={DEFAULT_STATE}
  on:state
  on:action
  hideOverflow
>
  <svelte:fragment slot="toolbar">
    <DownloadMenu {fileName} data={tileData} {sensor} prepareRow={(row) => row.dump} advanced={false} />
  </svelte:fragment>
  <div class="root">
    <HexGrid columns={maxColumn} style="gap: 2px; margin: 12px 24px">
      {#await tileData then tiles}
        {#each tiles as tile (tile.region.propertyId)}
          <HexGridCell
            x={tile.x}
            y={tile.y}
            tooltip={`${sensor.formatValue(tile.value ? tile.value.value : null)} ${sensor.unitHTML}`}
            classNameOuter="state-cell {isSelected(tile, sensor, date, highlight) ? 'selected' : ''}"
            style={style(tile.value)}
            on:mouseenter={() => onMouseEnter(tile)}
            on:mouseleave={onMouseLeave}
          >
            <span class="title">{tile.region.propertyId}</span>
          </HexGridCell>
        {/each}
      {/await}
    </HexGrid>
    <ColorLegend {sensor} level="state" gradientLength={280} value={highlightedValue} />
  </div>
</WidgetCard>

<style>
  .title {
    font-size: 0.65rem;
    line-height: 1;
  }

  .root {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .root > :global(.legend) {
    margin-bottom: 0;
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
