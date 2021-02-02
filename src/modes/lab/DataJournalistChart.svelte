<script>
  import { timeDay } from 'd3-time';
  // import Tooltip from '../../components/MapBox/Tooltip.svelte';
  import Vega from '../../components/Vega.svelte';
  // import { addMissing, fetchTimeSlice } from '../../data';
  // import { defaultRegionOnStartup, sensorList } from '../../stores/constants';
  import { sequenceGen } from './seq';
  import {generateLineChartSpec} from './lineSpec';

  // const sensor = sensorList.find((d) => d.isCasesOrDeath);

  const spec = generateLineChartSpec('Random', true);
  const specNoPadding = generateLineChartSpec('No Padding', false);

  function gen(min, max, seed) {
    const seq = sequenceGen(min, max, seed);
    return timeDay.range(new Date(2020, 12 - 1, 1), new Date(), 1).map((date_value) => ({
      date_value,
      value: seq(),
    }));
  }

  // const data = fetchTimeSlice(sensor, 'county', defaultRegionOnStartup.county, new Date(2020, 12 - 1, 1), new Date()).then((r) =>
  //   addMissing(r, sensor),
  // );

  const dataWide = gen(0, 100);
  const dataWide2 = gen(0, 100, 'x');
  const dataLowBand = gen(3, 8);
  const dataMidBand = gen(0, 60);
  const dataHighBand = gen(87, 92);
</script>

<style>
</style>

<h2>Data Journalist Chart</h2>

<Vega {spec} data={dataWide} />
<Vega spec={specNoPadding} data={dataWide} />
<Vega {spec} data={dataWide2} />
<Vega spec={specNoPadding} data={dataWide2} />
<Vega {spec} data={dataLowBand} />
<Vega spec={specNoPadding} data={dataLowBand} />
<Vega {spec} data={dataMidBand} />
<Vega spec={specNoPadding} data={dataMidBand} />
<Vega {spec} data={dataHighBand} />
<Vega spec={specNoPadding} data={dataHighBand} />
