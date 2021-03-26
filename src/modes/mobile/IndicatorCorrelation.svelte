<script>
  import { sensorList } from '../../stores';
  import Search from '../../components/Search.svelte';
  import FancyHeader from './FancyHeader.svelte';
  import IndicatorCorrelationChart from './IndicatorCorrelationChart.svelte';
  import IndicatorCorrelationDetails from './IndicatorCorrelationDetails.svelte';

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
   @type {import("../../stores/params").Sensor | null}
   */
  let selected = null;

  $: otherSensors = sensorList.filter((d) => d.key !== sensor.key);

  $: primary = sensor.value;
  $: primaryData = fetcher.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame);
  $: secondary = selected;
  $: secondaryData = secondary ? fetcher.fetch1Sensor1RegionNDates(secondary, region, date.windowTimeFrame) : null;

  $: sensorDataPromises = sensorList.map((sensor) =>
    fetcher.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame),
  );
  $: sensorCorrelationData = loadAllSensorsData(sensorDataPromises);

  function loadAllSensorsData(sensorPromises) {
    // for each time_value, merge data values across sensors.
    const sensorDateMap = {};
    const sensorKeysMap = {}; // map from sensor key to sensor.
    return Promise.all(sensorPromises).then((allSensorsData) => {
      allSensorsData.forEach((sensorRows, index) => {
        const sensor = sensorList[index];
        sensorRows.forEach((row) => {
          const time_value_key = String(row.time_value);
          if (!sensorDateMap[time_value_key]) {
            sensorDateMap[time_value_key] = { ...row };
          }
          const sensorKey = sensor.key;
          sensorKeysMap[sensorKey] = sensor;
          sensorDateMap[time_value_key][sensorKey] = row.value;
        });
      });
      // console.info('sensorDateMap', sensorDateMap);
      return Object.values(sensorDateMap);
    });
  }
</script>

<FancyHeader sub="Correlation">{sensor.name}</FancyHeader>

<ul class="uk-tab uk-child-width-expand">
  <li class:uk-active={selected == null}><a href="#overview" on:click={() => (selected = null)}>Overview</a></li>
  <li class:uk-active={selected != null}>
    <a href="#details" on:click={() => (selected = otherSensors[0])}>Individual</a>
  </li>
</ul>
{#if !selected}
  <table class="mobile-table">
    <thead>
      <tr>
        <th class="mobile-th"><span>Indicator</span></th>
      </tr>
    </thead>
    <tbody>
      {#each otherSensors as sensor (sensor.key)}
        <tr>
          <td>
            <a
              href="../indicator?sensor={sensor.key}"
              class="uk-link-text"
              on:click|preventDefault={() => (selected = sensor)}>
              {sensor.name}
            </a>
          </td>
          <td style="width: 70px; height: 70px">
            <IndicatorCorrelationChart
              {sensorCorrelationData}
              {primary}
              secondary={sensor}
              options={{ height: 70, padding: 0, axisTitles: false, showTitle: false, ticks: false, tickLabels: false }}
              on:click={() => (selected = sensor)} />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <Search
    className="grid-3-11"
    modern
    placeholder="Select Indicator"
    items={otherSensors}
    icon="search"
    selectedItem={selected}
    labelFieldName="name"
    maxItemsToShowInList="5"
    clear={false}
    on:change={(e) => {
      const newIndicator = e.detail ? sensorList.find((d) => d.key === e.detail.key) : null;
      if (newIndicator !== selected) {
        selected = newIndicator;
      }
    }} />
  {#await Promise.all([primaryData, secondaryData]) then data}
    <IndicatorCorrelationDetails {primary} secondary={selected} primaryData={data[0]} secondaryData={data[1]} />
  {/await}
{/if}
