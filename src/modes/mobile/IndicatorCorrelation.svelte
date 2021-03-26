<script>
  import { sensorList } from '../../stores';
  import Search from '../../components/Search.svelte';
  import FancyHeader from './FancyHeader.svelte';
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

  $: primaryData = fetcher.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame);
  $: secondaryData = selected ? fetcher.fetch1Sensor1RegionNDates(selected, region, date.windowTimeFrame) : null;
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
    <IndicatorCorrelationDetails
      primary={sensor.value}
      secondary={selected}
      primaryData={data[0]}
      secondaryData={data[1]} />
  {/await}
{/if}
