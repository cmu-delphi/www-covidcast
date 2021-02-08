<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchRegionSlice, fetchTimeSlice, addMissing } from '../../data';
  import { DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';
  import { generateStateSpec } from './mapSpec';
  import { generateLineChartSpec, patchHighlightTuple } from './lineSpec';
  import { currentDate, currentDateObject, stats } from '../../stores';
  import { formatDateShortOrdinal } from '../../formats';
  import debounce from 'lodash-es/debounce';
  import { determineMinMax } from '../../components/MapBox/colors';
  import { resolveHighlightedTimeValue } from '../overview/vegaSpec';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  function genMapSpec(stats, sensor) {
    const stateSpec = generateStateSpec(`${sensor.name} - States`);
    stateSpec.height = 400;
    stateSpec.title = null;
    const scale = stateSpec.layer[stateSpec.layer.length - 1].encoding.color.scale;
    scale.domain = determineMinMax(stats, sensor, 'state', {}, false);
    return stateSpec;
  }

  $: stateSpec = genMapSpec($stats, sensor);

  const lineSpec = generateLineChartSpec(`${sensor.name} - US`, true, $currentDateObject);
  // lineSpec.padding.left = 50;
  lineSpec.height = 150;
  lineSpec.title = null;

  const nationData = fetchTimeSlice(sensor, 'nation', 'us').then((r) => addMissing(r, sensor));

  $: stateData = fetchRegionSlice(sensor, 'state', $currentDateObject);

  const lazyUpdate = debounce((value) => {
    currentDate.set(value);
  }, 1000);

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const date = resolveHighlightedTimeValue(event);
      if (date) {
        lazyUpdate(date);
      }
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
    signalListeners={['highlight']}
    signals={{ highlight_tuple: patchHighlightTuple }}
    on:signal={onSignal} />
  <Vega spec={stateSpec} data={stateData} />
</div>
