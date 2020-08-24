<script>
  import { currentDateObject, yesterdayDate } from '../../stores';
  import spec from '../overview/SmallMultiplesChart.json';
  import Vega from '../../components/vega/Vega.svelte';
  import { parseAPITime } from '../../data';
  import { fetchTimeSlice } from '../../data/fetchData';

  /**
   * @type {string}
   */
  export let id;

  /**
   * @type {string}
   */
  export let level;

  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200401');
  const finalDay = yesterdayDate;

  /**
   * @type {import('../../stores/constants').SensorEntry}
   */
  export let sensor;
  /**
   * @type {import('../../data/fetchData').EpiDataRow}
   */
  export let single;

  $: data = fetchTimeSlice(sensor, level, id, startDay, finalDay, true);
</script>

<style>
  .right {
    text-align: right;
  }

  .chart {
    width: 20em;
    height: 4em;
    position: relative;
    padding: 0;
    box-sizing: border-box;
  }

  .chart > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }
</style>

{#if sensor.isCasesOrDeath}
  <td class="right">{single.count != null ? sensor.formatValue(single.count) : 'Unknown'}</td>
  <td class="right">{single.avg != null ? sensor.formatValue(single.avg) : 'Unknown'}</td>
{:else}
  <td class="right">{single.value != null ? sensor.formatValue(single.value) : 'Unknown'}</td>
{/if}
<td class="chart">
  <Vega {data} {spec} signals={{ currentDate: $currentDateObject }} />
</td>
