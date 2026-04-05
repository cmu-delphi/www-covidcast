<script>
  import Vega from '../components/vega/Vega.svelte';
  import { formatDateISO } from '../formats';
  import { getCountiesOfState, getInfoByName } from '../data/regions';
  import { generateCountiesOfStateSpec, generateRelatedCountySpec, generateStateSpec } from '../specs/mapSpec';
  import { isMobileDevice } from '../stores';
  import DownloadMenu from '../components/DownloadMenu.svelte';
  import FullWidthWrapper from '../components/FullWidthWrapper.svelte';
  import RegionMapTooltip from './RegionMapTooltip.svelte';
  import IndicatorFallbackWarning from './IndicatorFallbackWarning.svelte';

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
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").RegionParam} region
   */
  function genSpec(sensor, region) {
    const hasCounty = sensor.value.levels.includes('county');
    const options = {
      ...sensor.vegaSchemeDomain(
        (region.level === 'state' || region.level === 'county') && hasCounty ? 'county' : 'state',
      ),
      withStates: true,
    };
    if (region.level === 'state' && hasCounty) {
      return generateCountiesOfStateSpec(region.value, options);
    }
    if (region.level === 'county' && hasCounty) {
      return generateRelatedCountySpec(region.value, options);
    }
    // state
    if (region.level === 'state') {
      options.initialRegion = [region.propertyId.toLowerCase()];
    }
    return generateStateSpec(options);
  }

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadData(sensor, date, region) {
    const hasCounty = sensor.value.levels.includes('county');
    if (region.level === 'state' && hasCounty) {
      const counties = getCountiesOfState(region.value);
      const countyData = fetcher.fetch1SensorNRegions1DateWithFallback(
        sensor,
        [...counties, getInfoByName(`${region.id}000`)],
        date,
      );
      const stateData = fetcher.fetch1SensorNRegions1DateWithFallback(sensor, 'state', date);
      return Promise.all([countyData, stateData]).then((r) => r.flat());
    }
    if (region.level === 'county' && hasCounty) {
      return fetcher.fetch1SensorNRegions1Date(sensor, 'county', date);
    }
    return fetcher.fetch1SensorNRegions1DateWithFallback(sensor, 'state', date);
  }

  $: fallbackLevel =
    region.level === 'county' || (region.level === 'state' && sensor.value.levels.includes('county'))
      ? 'county'
      : 'state';

  function generateFileName(sensor, date, region) {
    const hasCounty = sensor.value.levels.includes('county');
    let regionName = region.level === 'nation' || !hasCounty ? 'US States' : 'US Counties';
    if (region.level === 'state' && hasCounty) {
      regionName = `${region.displayName} Counties`;
    }
    return `${sensor.name}_${regionName}_${formatDateISO(date.value)}`;
  }

  $: spec = genSpec(sensor, region);
  $: data = loadData(sensor, date, region);

  $: showsUS = region.level === 'nation';

  $: fileName = generateFileName(sensor, date, region);

  let vegaRef = null;

  function onClickHandler(evt) {
    const item = evt.detail.item;
    if ($isMobileDevice || !item || !item.datum || !item.datum.propertyId) {
      return; // no click on mobile
    }
    region.set(item.datum, true);
  }
</script>

<FullWidthWrapper>
  <div class="chart-aspect-4-3">
    <Vega
      bind:this={vegaRef}
      className={showsUS ? '' : 'mobile-map'}
      {spec}
      {data}
      tooltip={RegionMapTooltip}
      tooltipProps={{ sensor, regionSetter: region.set }}
      on:click={onClickHandler}
      eventListeners={['click']}
    />
    <DownloadMenu {vegaRef} {data} {date} {region} {sensor} absolutePos {fileName} />
  </div>
</FullWidthWrapper>

<IndicatorFallbackWarning
  sensor={sensor.value}
  level={fallbackLevel}
  date={date.value}
  trend={data.then((rows) => rows[0])}
/>
{#if fallbackLevel === 'county'}
  <IndicatorFallbackWarning
    prefix="†"
    sensor={sensor.value}
    level={'state'}
    date={date.value}
    trend={data.then((rows) => rows.find((d) => d.level === 'state'))}
  />
{/if}
