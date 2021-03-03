<script>
  import Vega from '../../components/Vega.svelte';
  import { getCountiesOfState } from '../../maps';
  import {
    generateCountiesOfStateSpec,
    generateRelatedCountySpec,
    generateStateSpec,
    generateCountySpec,
  } from '../../specs/mapSpec';
  import { stats } from '../../stores';
  import RegionMapTooltip from './RegionMapTooltip.svelte';
  import Toggle from './Toggle.svelte';

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
  /**
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  export let height = 300;

  let showCounties = false;

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").RegionParam} region
   */
  function genSpec(stats, sensor, region, height, showCounties) {
    const options = {
      height,
      domain: sensor.domain(
        stats,
        region.level === 'state' || region.level === 'county' || (region.level === 'nation' && showCounties)
          ? 'county'
          : 'state',
      ),
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
    if (showCounties) {
      return generateCountySpec(options);
    }
    return generateStateSpec(options);
  }

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadData(sensor, date, showCounties) {
    if (region.level === 'state') {
      const counties = getCountiesOfState(region.value);
      const countyData = fetcher.fetch1SensorNRegions1Date(
        sensor,
        'county',
        `${region.id}000,${counties.map((d) => d.id).join(',')}`,
        date,
      );
      const stateData = fetcher.fetch1SensorNRegions1Date(sensor, 'state', '*', date);
      return Promise.all([countyData, stateData]).then((r) => r.flat());
    }
    if (region.level === 'county' || showCounties) {
      return fetcher.fetch1SensorNRegions1Date(sensor, 'county', '*', date);
    }
    return fetcher.fetch1SensorNRegions1Date(sensor, 'state', '*', date);
  }

  $: spec = genSpec($stats, sensor, region, height, showCounties);
  $: data = loadData(sensor, date, showCounties);
</script>

<Vega
  className="mobile-map {className}"
  {spec}
  {data}
  tooltip={RegionMapTooltip}
  tooltipProps={{ sensor, regionSetter: region.set }} />

{#if region.level === 'nation'}
  <Toggle bind:checked={showCounties}>Show US Counties</Toggle>
{/if}
