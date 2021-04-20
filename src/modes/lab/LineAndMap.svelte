<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { fetchRegionSlice, fetchTimeSlice, addMissing, addNameInfos } from '../../data';
  import { DEFAULT_SURVEY_SENSOR, sensorMap } from '../../stores/constants';
  import { generateStateSpec } from '../../specs/mapSpec';
  import { generateLineChartSpec, signalPatches, resolveHighlightedDate } from '../../specs/lineSpec';
  import { currentDate, currentDateObject, stats } from '../../stores';
  import { formatDateShortOrdinal } from '../../formats';
  import debounce from 'lodash-es/debounce';
  import { determineMinMax } from '../../components/MapBox/colors';

  const sensor = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  function genMapSpec(stats, sensor) {
    const stateSpec = generateStateSpec({ height: 400 });
    const scale = stateSpec.layer[stateSpec.layer.length - 2].encoding.color.scale;
    scale.domain = determineMinMax(stats, sensor, 'state', {}, false);
    return stateSpec;
  }

  $: stateSpec = genMapSpec($stats, sensor);

  const lineSpec = generateLineChartSpec({ height: 150, initialDate: $currentDateObject });

  const nationData = fetchTimeSlice(sensor, 'nation', 'us').then((r) => addMissing(r, sensor));

  $: stateData = fetchRegionSlice(sensor, 'state', $currentDateObject).then(addNameInfos);

  const lazyUpdate = debounce((value) => {
    currentDate.set(value);
  }, 1000);

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const date = resolveHighlightedDate(event);
      if (date) {
        lazyUpdate(date);
      }
    }
  }
</script>

<div class="uk-container root">
  <h2>{sensor.name} as of {formatDateShortOrdinal($currentDateObject)}</h2>
  <Vega
    spec={lineSpec}
    data={nationData}
    signalListeners={['highlight']}
    signals={signalPatches}
    on:signal={onSignal}
  />
  <Vega spec={stateSpec} data={stateData} />
</div>

<style>
  .root {
    display: flex;
    flex-direction: column;
    margin: 0;
  }
</style>
