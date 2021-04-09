<script>
  import { addMissing, fetchData, formatAPITime } from '../../data';
  import { sensorList, sensorMap } from '../../stores/constants';
  import { state2TileCell } from '../../specs/matrixSpec';
  import { currentDateObject, stats, currentRegion, currentRegionInfo } from '../../stores';
  import { formatDateShortOrdinal } from '../../formats';
  import { generateSparkLine } from '../../specs/lineSpec';
  import { timeWeek } from 'd3-time';
  import Vega from '../../components/Vega.svelte';
  import { getInfoByName } from '../../maps';
  import { determineColorScale, determineMinMax } from '../../components/MapBox/colors';
  import HexGrid from '../mobile/components/HexGrid.svelte';
  import HexGridCell from '../mobile/components/HexGridCell.svelte';
  import RegionHexGridCell from './components/RegionHexGridCell.svelte';
  import SensorHexGridCell from './components/SensorHexGridCell.svelte';
  import { toTimeValue } from '../../stores/params';

  let sensor = sensorList.find((d) => d.isCasesOrDeath);

  const masks = sensorMap.get('fb-survey-smoothed_wearing_mask');
  const cli = sensorMap.get('fb-survey-smoothed_cli');
  const hospital = sensorMap.get('hospital-admissions-smoothed_adj_covid19_from_claims');
  const deaths = sensorMap.get('indicator-combination-deaths_7dav_incidence_prop');
  const cases = sensorMap.get('indicator-combination-confirmed_7dav_incidence_prop');
  const vaccine = sensorMap.get('fb-survey-smoothed_covid_vaccinated_or_accept');

  function loadData(sensor, date) {
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

  $: stateData = loadData(sensor, $currentDateObject);
  $: spec = generateSparkLine({ color: '#666' });

  $: colorScale = determineColorScale(determineMinMax($stats, sensor, 'state', {}), sensor, 'prop').scale;

  const maxColumn = state2TileCell.reduce((acc, v) => Math.max(acc, v.x), 0) + 1;

  $: params = {
    date: $currentDateObject,
    timeValue: toTimeValue($currentDateObject),
    region: $currentRegionInfo || getInfoByName('ca', 'state'),
  };
</script>

<div class="uk-container root">
  <h2>{sensor.name} as of {formatDateShortOrdinal($currentDateObject)}</h2>
  <p>
    {@html sensor.description}
  </p>
  <HexGrid columns={maxColumn} style="gap: 2px">
    {#each stateData as tile}
      {#await tile.value}
        <HexGridCell
          x={tile.x}
          y={tile.y}
          classNameOuter="state-cell {params.region.propertyId === tile.propertyId ? 'selected' : ''}"
          className="loading"
        >
          <span class="title">{tile.propertyId}</span>
          <div class="vega-wrapper" />
          <span class="value"> ? </span>
        </HexGridCell>
      {:then v}
        <HexGridCell
          x={tile.x}
          y={tile.y}
          classNameOuter="state-cell {params.region.propertyId === tile.propertyId ? 'selected' : ''}"
          style="background-color: {colorScale(v)};"
          on:click={() => currentRegion.set(tile.propertyId)}
        >
          <span class="title">{tile.propertyId}</span>
          <div class="vega-wrapper">
            <Vega {spec} data={tile.values} signals={{ currentDate: $currentDateObject }} noDataText="?" />
          </div>
          <span class="value"> {sensor.formatValue(v)} </span>
        </HexGridCell>
      {/await}
    {/each}
  </HexGrid>

  <h3>Details {params.region.displayName}</h3>
  <div class="content-grid">
    <HexGrid className="grid-3-11" columns={3} style="gap: 2px" fit>
      <RegionHexGridCell x={1} y={2} {params} />
      <SensorHexGridCell
        x={0}
        y={1}
        {params}
        sensor={masks}
        on:click={() => {
          sensor = masks;
        }}
      />
      <SensorHexGridCell
        x={1}
        y={1}
        {params}
        sensor={cli}
        on:click={() => {
          sensor = cli;
        }}
      />
      <SensorHexGridCell
        x={2}
        y={2}
        {params}
        sensor={cases}
        on:click={() => {
          sensor = cases;
        }}
      />
      <SensorHexGridCell
        x={0}
        y={3}
        {params}
        sensor={deaths}
        on:click={() => {
          sensor = deaths;
        }}
      />
      <SensorHexGridCell
        x={1}
        y={3}
        {params}
        sensor={hospital}
        on:click={() => {
          sensor = hospital;
        }}
      />
      <SensorHexGridCell
        x={0}
        y={2}
        {params}
        sensor={vaccine}
        on:click={() => {
          sensor = vaccine;
        }}
      />
    </HexGrid>
  </div>
</div>

<style>
  .root {
    display: flex;
    flex-direction: column;
    margin: 0;
  }

  .title,
  .value {
    font-size: 80%;
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

  .root :global(.state-cell:hover),
  .root :global(.state-cell.selected) {
    filter: drop-shadow(0 0 2px #ccc);
  }
  .root :global(.state-cell.selected) {
    filter: drop-shadow(0 0 2px #888);
  }
</style>
