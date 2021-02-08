<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchData, formatAPITime } from '../../data';
  import { getInfoByName, getCountiesOfState } from '../../maps';
  import { DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';
  import { generateCountiesOfStateSpec } from '../../specs/mapSpec';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);
  const date = new Date(2021, 1 - 1, 15);

  function generateState(stateId) {
    const state = getInfoByName(stateId);
    const counties = getCountiesOfState(state);
    const spec = generateCountiesOfStateSpec(state);
    const data = fetchData(sensor, 'county', `${state.id}000,${counties.map((d) => d.id).join(',')}`, date, {
      time_value: formatAPITime(date),
    });
    return { state, spec, data };
  }

  const ca = generateState('ca');
  const ny = generateState('ny');
  const pa = generateState('pa');

  // fetch counties and mega county
</script>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }
  h3 {
    margin-top: 0;
    text-align: center;
  }
</style>

<h2>State Maps</h2>

<div class="grid">
  <h3>{ca.state.displayName}</h3>
  <h3>{ny.state.displayName}</h3>
  <h3>{pa.state.displayName}</h3>
  <Vega spec={ca.spec} data={ca.data} />
  <Vega spec={ny.spec} data={ny.data} />
  <Vega spec={pa.spec} data={pa.data} />
</div>
