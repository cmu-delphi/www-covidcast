<script>
  import { addMissing, fetchData, formatAPITime } from '../../data';
  import { sensorList } from '../../stores/constants';
  import { state2TileCell } from '../../specs/matrixSpec';
  import { currentDateObject, stats } from '../../stores';
  import { formatDateShortOrdinal } from '../../formats';
  import { generateSparkLine } from '../../specs/lineSpec';
  import { timeWeek } from 'd3-time';
  import Vega from '../../components/Vega.svelte';
  import { getInfoByName } from '../../maps';
  import { determineColorScale, determineMinMax } from '../../components/MapBox/colors';
  import HexGrid from './components/HexGrid.svelte';
  import HexGridCell from './components/HexGridCell.svelte';

  const sensor = sensorList.find((d) => d.isCasesOrDeath);

  function loadData(date) {
    const loaded = fetchData(
      sensor,
      'state',
      '*',
      `${formatAPITime(timeWeek.offset(date, -4))}-${formatAPITime(date)}`,
      {},
      { multiValues: false },
    );
    return state2TileCell.map((tile) => {
      const d = getInfoByName(tile.id);
      const geoValue = d.propertyId.toLowerCase();
      const rows = loaded.then((rows) => addMissing(rows.filter((r) => r.geo_value === geoValue)));
      return {
        ...tile,
        ...d,
        values: rows,
        value: rows.then((rows) => {
          const v = rows.find((r) => r.date_value.getTime() == date.getTime());
          return v ? v.value : null;
        }),
      };
    });
  }

  $: stateData = loadData($currentDateObject);
  $: spec = generateSparkLine({ color: '#666' });

  $: colorScale = determineColorScale(determineMinMax($stats, sensor, 'state', {}), sensor, 'prop').scale;

  const maxColumn = state2TileCell.reduce((acc, v) => Math.max(acc, v.x), 0) + 1;
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
    margin: 0;
  }

  .title, .value {
    font-size: 80%;
  }

  .vega-wrapper {
    margin: 0 2px;
  }
  .root :global(.message-overlay)::after {
    padding: 0;
  }
</style>

<div class="uk-container root">
  <h2>{sensor.name} as of {formatDateShortOrdinal($currentDateObject)}</h2>
  <HexGrid columns={maxColumn} style="gap: 2px">
    {#each stateData as tile}
      {#await tile.value}
        <HexGridCell x={tile.x} y={tile.y} className="loading">
          <span class="title">{tile.propertyId}</span>
          <div class="vega-wrapper" />
          <span class="value"> ? </span>
        </HexGridCell>
      {:then v}
        <HexGridCell x={tile.x} y={tile.y} style="background-color: {colorScale(v)}">
          <span class="title">{tile.propertyId}</span>
          <div class="vega-wrapper">
            <Vega {spec} data={tile.values} signals={{ currentDate: $currentDateObject }} noDataText="?" />
          </div>
          <span class="value"> {sensor.formatValue(v)} </span>
        </HexGridCell>
      {/await}
    {/each}
  </HexGrid>
</div>
