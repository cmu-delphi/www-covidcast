<script>
  import { determineMinMax } from '../../components/MapBox/colors';
  import Vega from '../../components/Vega.svelte';
  import { getCountiesOfState } from '../../maps';
  import { generateCountiesOfStateSpec, generateRelatedCountySpec, generateStateSpec } from '../../specs/mapSpec';
  import { stats } from '../../stores';
  import RegionMapTooltip from './RegionMapTooltip.svelte';

  export let className = '';
  /**
   * @type {import("../utils").Params}
   */
  export let params;

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;

  /**
   * @param {import('../../stores/constants').SensorEntry} sensor
   * @param {import('../../maps').NameInfo} region
   */
  function genSpec(stats, sensor, region) {
    const options = {
      height: 400,
      domain: determineMinMax(
        stats,
        sensor,
        region.level === 'state' || region.level === 'county' ? 'county' : 'state',
        {},
        false,
      ),
      legendTitle: sensor.isCasesOrDeath ? `${sensor.yAxis} per 100,000` : sensor.yAxis,
      scheme: sensor.colorScaleId === 'interpolateYlGnBu' ? 'yellowgreenblue' : 'yelloworangered',
    };
    if (region.level === 'state') {
      return generateCountiesOfStateSpec(region, options);
    }
    if (region.level === 'county') {
      return generateRelatedCountySpec(region, options);
    }
    // state
    return generateStateSpec(options);
  }

  /**
   * @param {import('../../stores/constants').SensorEntry} sensor
   * @param {import("../utils").Params} params
   */
  function loadData(sensor, params) {
    if (params.region.level === 'state') {
      const counties = getCountiesOfState(params.region);
      return params.fetchMultiRegions(
        sensor,
        'county',
        `${params.region.id}000,${counties.map((d) => d.id).join(',')}`,
      );
    }
    if (params.region.level === 'county') {
      return params.fetchMultiRegions(sensor, 'county', '*');
    }
    return params.fetchMultiRegions(sensor, 'state', '*');
  }

  $: spec = genSpec($stats, sensor, params.region);
  $: data = loadData(sensor, params);
</script>

<Vega {className} {spec} {data} tooltip={RegionMapTooltip} tooltipProps={{ sensor: params.sensor }} />
