<script>
  import { getContext } from 'svelte';
  import { formatDateYearWeekdayAbbr } from '../../../formats';
  import SensorUnit from '../../mobile/SensorUnit.svelte';
  import SurveyValue from '../../survey/SurveyValue.svelte';
  import WidgetCard from './WidgetCard.svelte';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  /**
   * @type {import("../../../stores/params").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  $: data = fetcher.fetch1Sensor1Region1DateDetails(sensor, region, date);
  $: highlighted = highlight != null && highlight.matches(sensor.value, region.value, date.value);
</script>

<WidgetCard {highlighted}>
  <div class="content">
    <div class="kpi">
      <div>
        {#await data}
          <SurveyValue value={null} />
        {:then d}
          <SurveyValue value={d ? d.value : null} />
        {/await}
      </div>
      <div>
        <SensorUnit {sensor} long />
      </div>
    </div>
    <table>
      <tbody>
        <tr>
          <th>What:</th>
          <td>{sensor.name}</td>
        </tr>
        <tr>
          <th>Where:</th>
          <td>{region.displayName}</td>
        </tr>
        <tr>
          <th>When:</th>
          <td>{formatDateYearWeekdayAbbr(date.value)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</WidgetCard>

<style>
  .content {
    display: flex;
    flex-direction: column;
  }
  .kpi {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
