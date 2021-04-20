<script>
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { modeByID } from '..';
  import { sensorList, currentMode, currentSensor2 } from '../../stores';
  import { scrollToTop } from '../../util';
  import { generateCorrelationMetrics } from '../../data/correlation';
  import { formatRawValue } from '../../formats';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import SortColumnIndicator from '../../components/Table/SortColumnIndicator.svelte';
  import { SortHelper } from '../../components/Table/tableUtils';
  import AboutSection from '../../components/AboutSection.svelte';

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

  const sort = new SortHelper('r2AtMaxR2', true, 'name');

  /**
   * @param {SensorEntry} context
   * @param {SensorEntry} compare
   * @param {import("../../stores/params").RegionParam} region
   * @param {import("../../stores/params").DateParam} date
   * @returns {Promise<CorrelationMetric>}
   */
  function buildMetrics(context, compare, region, date) {
    const contextData = fetcher.fetch1Sensor1RegionNDates(context, region, date.windowTimeFrame);
    const compareData = fetcher.fetch1Sensor1RegionNDates(compare, region, date.windowTimeFrame);
    return Promise.all([contextData, compareData]).then((p) => {
      const metrics = generateCorrelationMetrics(p[0], p[1]);
      return metrics;
    });
  }

  let loaded = 0;
  /**
   * Starting from a list of sensors, mix in all of the other columns needed for the table.
   * @param {SensorEntry} context
   * @param {import("../../stores/params").RegionParam} region
   * @param {import("../../stores/params").DateParam} date
   */
  function buildTableData(context, region, date) {
    loaded = 0;
    return sensorList
      .filter((d) => d.key !== context.key)
      .map((sensor) => {
        const metrics = buildMetrics(context, sensor, region, date);
        const r = {
          ...sensor,
          metrics,
        };
        metrics.then((met) => {
          // inline for sorting
          Object.assign(r, met);
          loaded++;
        });
        return r;
      });
  }

  $: otherSensors = buildTableData(sensor, region, date);

  function switchMode(sensor) {
    currentSensor2.set(sensor.key);
    currentMode.set(modeByID.correlation);
    scrollToTop();
  }

  // loaded
  $: rows = loaded > 0 ? otherSensors.sort($sort.comparator) : otherSensors;
</script>

<div class="grid-3-11">
  <FancyHeader sub="Correlation">{sensor.name}</FancyHeader>
</div>
<AboutSection details="What are correlations?">
  <p>
    The <strong>coefficient of determination</strong> (or <strong>R<sup>2</sup></strong>) is a measure of linear
    correlation that indicates the proportion of the variance in one indicator that is explained by the variance of
    another.
  </p>
  <p>
    In other words, how much does the movement in one indicator explain movement in another? For example, a change in
    new cases is reflected in a change in community symptoms.
    <strong>R<sup>2</sup></strong> ranges between <code>1.0</code> (entirely correlated) and <code>0.0</code> (no correlation
    at all).
  </p>
  <p>
    It is sometimes useful to examine signals that move together, but are offset in time.
    <strong>Lag</strong> is the number of days that an indicator is shifted backwards with respect to another. For example,
    a change in new cases is reflected in a change in deaths about 20 days later. In this example, new cases are most highly
    correlated with deaths at a lag of 20 days. A negative lag would indicate the indicator is shifted forwards.
  </p>
  <p>This table shows the following metrics between indicators:</p>
  <ul>
    <li><strong>R<sup>2</sup> at Lag 0</strong>: The correlation between indicators when there is no lag.</li>
    <li>
      <strong>Max R<sup>2</sup></strong>: the maximum correlation when evaluated with a lag between -28 and 28 days.
    </li>
    <li><strong>Lag at Max R<sup>2</sup></strong>: The number of days at which R<sup>2</sup> is maximized.</li>
  </ul>
</AboutSection>
<div class="grid-3-11">
  <table class="mobile-table">
    <thead>
      <tr>
        <th class="mobile-th"><span>Indicator</span></th>
        <th class="mobile-th uk-text-right"><span>R<sup>2</sup></span></th>
        <th class="mobile-th uk-text-right"><span>Max R<sup>2</sup></span></th>
        <th class="mobile-th uk-text-right"><span>Lag at Max R<sup>2</sup></span></th>
        <th class="mobile-th" />
      </tr><tr>
        <th class="sort-indicator uk-text-center">
          <SortColumnIndicator label="Indicator" {sort} prop="name" />
        </th>
        <th class="sort-indicator">
          <SortColumnIndicator label="R2" {sort} prop="r2At0" />
        </th>
        <th class="sort-indicator">
          <SortColumnIndicator label="Max R2" {sort} prop="r2AtMaxR2" />
        </th>
        <th class="sort-indicator">
          <SortColumnIndicator label="Lag at Max R2" {sort} prop="lagAtMaxR2" />
        </th>
        <th class="sort-indicator" />
      </tr>
    </thead>
    <tbody>
      {#each rows as sensor (sensor.key)}
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
            <td class="uk-text-right">&hellip;</td>
            <td class="uk-text-right">&hellip;</td>
            <td class="uk-text-right">&hellip;</td>
          {:then m}
            <td class="uk-text-right">{formatRawValue(m.r2At0)}</td>
            <td class="uk-text-right">{formatRawValue(m.r2AtMaxR2)}</td>
            <td class="uk-text-right">{m.lagAtMaxR2.toLocaleString()} days</td>
          {:catch err}
            <td colspan="3" class="small">{err.message}</td>
          {/await}
          <td>
            <a
              href="../correlation/?sensor2={sensor.key}"
              class="uk-link-text details-link"
              on:click|preventDefault={() => switchMode(sensor)}
            >
              {@html chevronRightIcon}
            </a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .details-link {
    width: 6px;
    display: inline-block;
    fill: currentColor;
  }

  .small {
    font-size: 0.75rem;
  }
</style>
