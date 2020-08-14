<script>
  import { currentRegion, currentLevel, currentRegionInfo } from '../../stores';
  import { parseAPITime } from '../../data/utils';
  import { fetchCustomTimeSlice } from '../../data/fetchData';
  import Vega from '../../components/vega/Vega.svelte';
  import spec from '../../components/vega/SmallMultipleSingleLineChart.json';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  export let sensor;
  // Create a date for today in the API's date format
  const startDay = parseAPITime('20200401');
  const finalDay = new Date();

  $: data = fetchCustomTimeSlice(sensor, $currentLevel, $currentRegion, startDay, finalDay);

  // patch in the yAxis name
  $: specPatched = {
    ...spec,
    encoding: {
      ...spec.encoding,
      y: {
        ...spec.encoding.y,
        axis: {
          ...spec.encoding.y.axis,
          title: sensor.yAxis ? sensor.yAxis : ' ',
        },
      },
    },
  };

  /**
   * @param {KeyboardEvent} e
   */
  function onEscCheck(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      dispatch('close');
    }
  }
</script>

<style>
  .single-sensor-chart {
    flex: 1 1 0;
  }

  .vega-wrapper {
    position: relative;
  }
  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  .header {
    position: relative;
  }

  .close {
    font-size: 0.7rem;
    position: absolute;
    right: 0;
    top: 0;
  }
</style>

<div class="header">
  <h4>{sensor.name} of {$currentRegionInfo ? $currentRegionInfo.display_name : 'Unknown'}</h4>
  <h5>{sensor.tooltipText}</h5>
  <button class="pg-button close" on:click={() => dispatch('close')} title="Close this detail view">
    <IoIosClose />
  </button>
</div>
<div class="single-sensor-chart vega-wrapper">
  <Vega {data} spec={specPatched} />
</div>
<svelte:window on:keydown={onEscCheck} />
