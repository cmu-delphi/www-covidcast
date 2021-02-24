<script>
  import { determineMinMax } from '../../components/MapBox/colors';
  import Vega from '../../components/Vega.svelte';
  import { getCountiesOfState } from '../../maps';
  import { generateCountiesOfStateSpec, generateRelatedCountySpec, generateStateSpec } from '../../specs/mapSpec';
  import { stats } from '../../stores';
  import RegionMapTooltip from './RegionMapTooltip.svelte';

  export let className = '';
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;

  export let height = 300;

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").RegionParam} region
   */
  function genSpec(stats, sensor, region, height) {
    const options = {
      height,
      domain: determineMinMax(
        stats,
        sensor.value,
        region.level === 'state' || region.level === 'county' ? 'county' : 'state',
        {},
        false,
      ),
      legendTitle: sensor.isCasesOrDeath ? `${sensor.value.yAxis} per 100,000` : sensor.value.yAxis,
      withStates: true,
      scheme: sensor.isInverted ? 'yellowgreenblue' : 'yelloworangered',
    };
    if (region.level === 'state') {
      return generateCountiesOfStateSpec(region.value, options);
    }
    if (region.level === 'county') {
      return generateRelatedCountySpec(region.value, options);
    }
    // state
    return generateStateSpec(options);
  }

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadData(sensor, date, region) {
    if (region.level === 'state') {
      const counties = getCountiesOfState(region.value);
      const countyData = date.fetchMultiRegions(
        sensor.value,
        'county',
        `${region.id}000,${counties.map((d) => d.id).join(',')}`,
      );
      const stateData = date.fetchMultiRegions(sensor.value, 'state', '*');
      return Promise.all([countyData, stateData]).then((r) => r.flat());
    }
    if (region.level === 'county') {
      return date.fetchMultiRegions(sensor.value, 'county', '*');
    }
    return date.fetchMultiRegions(sensor.value, 'state', '*');
  }

  $: spec = genSpec($stats, sensor, region, height);
  $: data = loadData(sensor, date, region);
</script>

<Vega
  {className}
  {spec}
  {data}
  tooltip={RegionMapTooltip}
  tooltipProps={{ sensor: sensor.value, regionSetter: region.set }} />
