<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchData, formatAPITime } from '../../data';
  import { getInfoByName } from '../../maps';
  import { currentDateObject } from '../../stores';
  import { defaultRegionOnStartup, sensorList } from '../../stores/constants';
  import { generateDistributionLineSpec, generateDistributionLineSpec2, signalPatches } from '../../specs/lineSpec';
  import VegaTooltip from './VegaTooltip.svelte';

  const sensor = Object.assign(
    {},
    sensorList.find((d) => d.isCasesOrDeath),
    {
      isCasesOrDeath: false, // hack to avoid loading all
    },
  );

  const state = getInfoByName(defaultRegionOnStartup.state);

  const spec = generateDistributionLineSpec(state, { initialDate: $currentDateObject });
  const spec2 = generateDistributionLineSpec2(state, { initialDate: $currentDateObject });

  const start = new Date(2020, 11 - 1, 1);
  const end = new Date();

  function loadData() {
    return fetchData(sensor, 'state', '*', `${formatAPITime(start)}-${formatAPITime(end)}`);
  }

  const data = loadData();
</script>

<style>
</style>

<h2>{state.displayName} - {sensor.name}</h2>

<Vega {spec} {data} signals={signalPatches} tooltip={VegaTooltip} tooltipProps={{ prop: 'geo_value' }} />
<Vega spec={spec2} {data} signals={signalPatches} tooltip={VegaTooltip} tooltipProps={{ prop: 'geo_value' }} />
