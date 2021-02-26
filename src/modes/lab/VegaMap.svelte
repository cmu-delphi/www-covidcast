<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchRegionSlice } from '../../data';
  import { DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';
  import {
    generateNationSpec,
    generateStateSpec,
    generateCountySpec,
    generateMSASpec,
    generateHRRSpec,
  } from '../../specs/mapSpec';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  const nationSpec = generateNationSpec();
  const stateSpec = generateStateSpec();
  const countySpec = generateCountySpec();
  const msaSpec = generateMSASpec();
  const hrrSpec = generateHRRSpec();

  const nationData = fetchRegionSlice(sensor, 'nation', new Date(2021, 1 - 1, 15));
  const stateData = fetchRegionSlice(sensor, 'state', new Date(2021, 1 - 1, 15));
  const countyData = fetchRegionSlice(sensor, 'county', new Date(2021, 1 - 1, 15));
  const msaData = fetchRegionSlice(sensor, 'msa', new Date(2021, 1 - 1, 15));
  const hrrData = fetchRegionSlice(sensor, 'hrr', new Date(2021, 1 - 1, 15));
</script>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }
</style>

<h2>Vega State Map</h2>

<div class="grid">
  <Vega spec={nationSpec} data={nationData} />
  <Vega spec={stateSpec} data={stateData} />
  <Vega spec={countySpec} data={countyData} />
  <Vega spec={msaSpec} data={msaData} />
  <Vega spec={hrrSpec} data={hrrData} />
</div>
