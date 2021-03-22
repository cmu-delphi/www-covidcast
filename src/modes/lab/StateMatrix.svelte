<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchRegionSlice } from '../../data';
  import { DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';
  import { generateMatrixStateSpec } from '../../specs/matrixSpec';
  import { currentDateObject, stats } from '../../stores';
  import { formatDateShortOrdinal } from '../../formats';
  import { determineMinMax } from '../../components/MapBox/colors';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  function genSpec(stats, sensor) {
    return generateMatrixStateSpec({ height: 400, domain: determineMinMax(stats, sensor, 'state', {}, false) });
  }

  $: stateSpec = genSpec($stats, sensor);
  $: stateData = fetchRegionSlice(sensor, 'state', $currentDateObject);
</script>

<div class="uk-container root">
  <h2>{sensor.name} as of {formatDateShortOrdinal($currentDateObject)}</h2>
  <Vega spec={stateSpec} data={stateData} className="embed" />
</div>

<style>
  .root {
    display: flex;
    flex-direction: column;
    margin: 0;
  }
  /* .root > :global(.embed) {
    align-self: center;
    width: 500px;

  } */
</style>
