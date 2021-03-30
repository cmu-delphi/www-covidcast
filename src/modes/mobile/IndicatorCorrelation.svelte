<script>
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { modeByID } from '..';
  import { sensorList, currentMode, currentSensor2 } from '../../stores';
  import { scrollToTop } from '../../util';
  import FancyHeader from './FancyHeader.svelte';

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

  $: otherSensors = sensorList.filter((d) => d.key !== sensor.key);

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
