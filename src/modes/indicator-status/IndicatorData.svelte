<script>
  import { metaDataManager } from '../../stores';
  import { DataFetcher } from '../../stores/DataFetcher';
  import HistoryLineChart from '../../blocks/HistoryLineChart.svelte';
  import OptionPicker from '../../components/OptionPicker.svelte';

  import { DateParam, RegionParam, SensorParam } from '../../stores/params';
  import { timeDay } from 'd3-time';

  /**
   * @type {import('../../data/sensor').Sensor}
   */
  export let sensor;
  /**
   * @type {import('../../data/regions').Region | null}
   */
  export let region = null;

  let asOfValue = null;
  $: asOf = asOfValue ? timeDay.floor(new Date(asOfValue)) : null;

  $: sensorParam = new SensorParam(sensor, $metaDataManager);
  $: regionParam = new RegionParam(region);

  $: fetcher = new DataFetcher(asOf);
  $: dateParam = new DateParam(asOf || sensorParam.timeFrame.max);
</script>

<OptionPicker
  className="uk-margin-top"
  type="date"
  label="Data As Of Date"
  placeholder="View previous version"
  bind:value={asOfValue}
  modern
/>

<div class="chart-300">
  <HistoryLineChart
    sensor={sensorParam}
    date={dateParam}
    region={regionParam}
    {fetcher}
    singleRegionOnly
    showAnnotations={false}
    expandableWindow="full"
  />
</div>
