<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchRegionSlice, fetchTimeSlice, addMissing } from '../../data';
  import { DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';
  import { generateStateSpec } from './mapSpec';
  import { generateLineChartSpec } from './lineSpec';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  const stateSpec = generateStateSpec(`${sensor.name} - States`);
  stateSpec.height = 300;
  stateSpec.title = null;

  const lineSpec = generateLineChartSpec(`${sensor.name} - US`, true);

  const stateData = fetchRegionSlice(sensor, 'state', new Date(2021, 1 - 1, 31));
  const nationData = fetchTimeSlice(sensor, 'nation', 'us', new Date(2020, 11 - 1, 1), new Date(2021, 1 - 1, 31), {
    geo_value: 'us',
  }).then((r) => addMissing(r, sensor));
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
  }
</style>

<div class="uk-container root">
  <h2>Line Chart + State Map</h2>
  <Vega spec={lineSpec} data={nationData} />
  <Vega spec={stateSpec} data={stateData} />
</div>
