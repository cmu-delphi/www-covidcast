<script>
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { modeByID } from '..';
  import { sensorList, currentMode, currentSensor2 } from '../../stores';
  import { SensorParam } from '../../stores/params';
  import { scrollToTop } from '../../util';
  import { generateCorrelationMetrics } from '../../data/utils';
  import FancyHeader from './FancyHeader.svelte';

  /**
   * @typedef {import('../../stores/constants').SensorEntry} SensorEntry
   */

  /**
   * @typedef {import("../../src/data/util").CorrelationMetric} CorrelationMetric
   */

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
   * @param {SensorEntry} sensorEntry
   * @returns {Promise<CorrelationMetric>}
   */
  function buildMetrics(sensorEntry) {
    const contextData = fetcher.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame);
    const compareData = fetcher.fetch1Sensor1RegionNDates(new SensorParam(sensorEntry), region, date.windowTimeFrame);
    return Promise.all([contextData, compareData]).then((p) => {
      const metrics = generateCorrelationMetrics(p[0], p[1]);
      return metrics;
    });
  }

  /**
   * Starting from a list of sensors, mix in all of the other columns needed for the table.
   */
  function buildTableData() {
    return sensorList
      .filter((d) => d.key !== sensor.key)
      .map((sensor) => {
        return {
          ...sensor,
          metrics: buildMetrics(sensor),
        };
      });
  }

  $: otherSensors = buildTableData();

  function switchMode(sensor) {
    currentSensor2.set(sensor.key);
    currentMode.set(modeByID.correlation);
    scrollToTop();
  }
</script>

<FancyHeader sub="Correlation">{sensor.name}</FancyHeader>

<table class="mobile-table">
  <thead>
    <tr>
      <th class="mobile-th"><span>Indicator</span></th>
      <th class="mobile-th"><span>R<sup>2</sup></span></th>
      <th class="mobile-th"><span>Max R<sup>2</sup></span></th>
      <th class="mobile-th"><span>Lag at Max R<sup>2</sup></span></th>
      <th class="mobile-th" />
    </tr>
  </thead>
  <tbody>
    {#each otherSensors as sensor (sensor.key)}
      <tr>
        <td>
          <a
            href="../correlation/?sensor2={sensor.key}"
            class="uk-link-text"
            on:click|preventDefault={() => switchMode(sensor)}
          >
            {sensor.name}
          </a>
        </td>
        {#await sensor.metrics}
          <td><p>...</p></td>
          <td><p>...</p></td>
          <td><p>...</p></td>
        {:then m}
          <td><p>{m.r2At0}</p></td>
          <td><p>{m.r2AtMaxR2}</p></td>
          <td><p>{m.lagAtMaxR2}</p></td>
        {/await}
        <td>
          <a
            href="../correlation/?sensor2={sensor.key}"
            class="uk-link-text"
            on:click|preventDefault={() => switchMode(sensor)}
          >
            {@html chevronRightIcon}
          </a>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
