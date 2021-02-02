<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchRegionSlice, fetchTimeSlice, addMissing } from '../../data';
  import { DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';
  import { generateStateSpec } from './mapSpec';
  import { generateLineChartSpec } from './lineSpec';
  import { CURRENT_DATE_HIGHLIGHT } from '../../components/vegaSpecUtils';
  import { currentDate, currentDateObject, stats } from '../../stores';
  import { formatDateShortOrdinal } from '../../formats';
import { determineMinMax } from '../../components/MapBox/colors';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  function genMapSpec(stats, sensor) {
    const stateSpec = generateStateSpec(`${sensor.name} - States`);
    stateSpec.height = 400;
    stateSpec.title = null;
    const scale = stateSpec.layer[stateSpec.layer.length -1].encoding.color.scale;
    scale.domain = determineMinMax(stats, sensor, 'state', {}, false);
    return stateSpec;
  }

  $: stateSpec = genMapSpec($stats, sensor);

  const lineSpec = generateLineChartSpec(`${sensor.name} - US`, true);
  // lineSpec.padding.left = 50;
  lineSpec.height = 150;
  lineSpec.title = null;
  lineSpec.layer.push(CURRENT_DATE_HIGHLIGHT);

  const nationData = fetchTimeSlice(sensor, 'nation', 'us').then((r) => addMissing(r, sensor));

  $: stateData = fetchRegionSlice(sensor, 'state', $currentDateObject);

  function resolveClickedTimeValue(e) {
    let item = e.detail.item;
    while(item && item.datum) {
      item = item.datum;
    }
    return item ? item.time_value : null;
  }

  function onClick(e) {
    const timeValue = resolveClickedTimeValue(e);
    if (timeValue) {
      currentDate.set(timeValue);
    }
  }
</script>

<style>
  .root {
    display: flex;
    flex-direction: column;
    margin: 0;
  }
</style>

<div class="uk-container root">
  <h2>{sensor.name} as of {formatDateShortOrdinal($currentDateObject)}</h2>
  <Vega
    spec={lineSpec}
    data={nationData}
    signals={{ currentDate: $currentDateObject }}
    eventListeners={['click']}
    on:click={onClick} />
  <Vega spec={stateSpec} data={stateData} />
</div>
