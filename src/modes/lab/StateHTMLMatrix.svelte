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

  const maxColumn = state2TileCell.reduce((acc, v) => Math.max(acc, v.x), 0);
  const maxRow = state2TileCell.reduce((acc, v) => Math.max(acc, v.y), 0);
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
    margin: 0;
  }

  .matrix {
    display: grid;
    gap: 3px;
  }
  .cell {
    padding-top: 57%;
    position: relative;
    /* border: 1px solid black; */
    background: #eee;
    border-radius: 2px;
    /* border-width: 0 1px; */
    margin-bottom: 28.5%;
  }
  .cell::before,
  .cell::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    border: inherit;
    background: inherit;
    box-shadow: inherit;
  }
  .cell::before {
    transform: rotate(60deg);
  }
  .cell::after {
    transform: rotate(-60deg);
  }
  .cell-content {
    font-size: 80%;
    position: absolute;
    z-index: 1;
    left: 0;
    top: -50%;
    bottom: -50%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    clip-path: polygon(0% 25%, 50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%);
  }

  .vega-wrapper {
    margin: 0 2px;
  }
  .cell-content :global(.message-overlay)::after {
    padding: 0;
  }
</style>

<div class="uk-container root">
  <h2>{sensor.name} as of {formatDateShortOrdinal($currentDateObject)}</h2>
  <div
    class="matrix"
    style="grid-template-columns: repeat({maxColumn * 2 + 2}, 1fr); grid-template-rows: repeat({maxRow}, 1fr);">
    {#each stateData as tile}
      {#await tile.value}
        <div
          class="cell"
          style="grid-area: {tile.y + 1} / {1 + tile.x * 2 + (tile.y % 2 === 1 ? 1 : 0)} / span 1 / span 2;">
          <div class="cell-content loading">
            <span class="title">{tile.propertyId}</span>
            <div class="vega-wrapper" />
            <span class="value"> ? </span>
          </div>
        </div>
      {:then v}
        <div
          class="cell"
          style="grid-area: {tile.y + 1} / {1 + tile.x * 2 + (tile.y % 2 === 1 ? 1 : 0)} / span 1 / span 2; background: {colorScale(v)}">
          <div class="cell-content">
            <span class="title">{tile.propertyId}</span>
            <div class="vega-wrapper">
              <Vega {spec} data={tile.values} signals={{ currentDate: $currentDateObject }} noDataText="?" />
            </div>
            <span class="value"> {sensor.formatValue(v)} </span>
          </div>
        </div>
      {/await}
    {/each}
  </div>
</div>
