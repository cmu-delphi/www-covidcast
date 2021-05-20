<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { addMissing, fetchTimeSlice, averageByDate } from '../../data';
  import { getInfoByName, nationInfo, getStateOfCounty } from '../../data/regions';
  import getRelatedCounties from '../../data/relatedRegions';
  import { currentDateObject } from '../../stores';
  import { defaultRegionOnStartup, DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';
  import VegaTooltip from './VegaTooltip.svelte';
  import { generateCompareLineSpec, signalPatches } from '../../specs/lineSpec';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  const county = getInfoByName(defaultRegionOnStartup.county);
  const related = getRelatedCounties(county);
  const state = getStateOfCounty(county);
  const nation = nationInfo;

  const spec = generateCompareLineSpec(
    [county.displayName, 'Related Counties', state.displayName, nation.displayName],
    { initialDate: $currentDateObject },
  );

  const start = new Date(2020, 12 - 1, 1);
  const end = new Date();

  function loadData() {
    const countyData = fetchTimeSlice(sensor, 'county', county.propertyId, start, end, false, {
      displayName: county.displayName,
    }).then((r) => addMissing(r, sensor));

    const relatedData = fetchTimeSlice(
      sensor,
      'county',
      related.map((d) => d.propertyId).join(','),
      start,
      end,
      false,
      {
        displayName: 'Related Counties',
      },
    )
      .then((r) => averageByDate(r, sensor))
      .then((r) => addMissing(r, sensor));

    const nationData = fetchTimeSlice(sensor, nation.level, [nation.propertyId], start, end, false, {
      displayName: nation.displayName,
    }).then((r) => addMissing(r, sensor));
    const stateData = fetchTimeSlice(sensor, state.level, [state.propertyId], start, end, false, {
      displayName: state.displayName,
    }).then((r) => addMissing(r, sensor));

    return Promise.all([countyData, nationData, stateData, relatedData]).then((rows) => rows.flat());
  }

  const data = loadData(county);
</script>

<h2>{county.displayName} - {sensor.name}</h2>

Related Counties:
{getRelatedCounties(county)
  .map((d) => d.displayName)
  .join(', ')}

<Vega {spec} {data} tooltip={VegaTooltip} signals={signalPatches} />

<style>
</style>
