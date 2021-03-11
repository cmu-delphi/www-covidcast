<script>
  import Vega from '../../components/Vega.svelte';
  import { formatDateISO } from '../../formats';
  import { getCountiesOfState } from '../../maps';
  import { generateCountiesOfStateSpec, generateRelatedCountySpec, generateStateSpec } from '../../specs/mapSpec';
  import { stats } from '../../stores';
  import DownloadMenu from './components/DownloadMenu.svelte';
  import RegionMapTooltip from './RegionMapTooltip.svelte';

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

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").RegionParam} region
   */
  function genSpec(stats, sensor, region) {
    const options = {
      domain: sensor.domain(stats, region.level === 'state' || region.level === 'county' ? 'county' : 'state'),
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
  function loadData(sensor, date) {
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
    if (region.level === 'county') {
      return fetcher.fetch1SensorNRegions1Date(sensor, 'county', '*', date);
    }
    return fetcher.fetch1SensorNRegions1Date(sensor, 'state', '*', date);
  }

  function generateFileName(sensor, date, region) {
    let regionName = region.level === 'nation' ? 'US States' : 'US Counties';
    if (region.level === 'state') {
      regionName = `${region.displayName} Counties`;
    }
    return `${sensor.name}_${regionName}_${formatDateISO(date.value)}`;
  }

  $: spec = genSpec($stats, sensor, region);
  $: data = loadData(sensor, date);

  $: showsUS = region.level === 'nation';

  $: fileName = generateFileName(sensor, date, region);

  let vegaRef = null;
</script>

<div class={showsUS ? 'chart-aspect-4-3' : 'chart-250'}>
  <Vega
    bind:this={vegaRef}
    className={showsUS ? '' : 'mobile-map'}
    {spec}
    {data}
    tooltip={RegionMapTooltip}
    tooltipProps={{ sensor, regionSetter: region.set }}
  />
  <DownloadMenu {vegaRef} {data} {sensor} absolutePos {fileName} />
</div>
