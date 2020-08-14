<script>
  import { currentRegion, currentLevel, currentRegionInfo } from '../../stores';
  import { fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../../components/vega/Vega.svelte';
  import spec from './DetailView.json';
  import specCasesDeath from './DetailViewCasesDeath.json';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import { createEventDispatcher } from 'svelte';
  import { merge } from 'lodash-es';
  import { isCasesSignal, isDeathSignal } from '../../data';

  const dispatch = createEventDispatcher();
  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  export let sensor;

  $: data = fetchTimeSlice(sensor, $currentLevel, $currentRegion);
  $: isCasesOrDeath = isCasesSignal(sensor.key) || isDeathSignal(sensor.key);

  function patchSpec(spec, size) {
    return merge({}, spec, {
      vconcat: [
        {
          width: size.width - 45,
          height: size.height - 60 - 70,
          encoding: {
            y: {
              axis: {
                title: sensor.yAxis || '',
              },
            },
          },
        },
        {
          width: size.width - 45,
          height: 60,
          encoding: {
            y: {
              axis: {
                title: sensor.yAxis || '',
              },
            },
          },
        },
      ],
    });
  }
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
  <Vega {data} spec={isCasesOrDeath ? specCasesDeath : spec} {patchSpec} />
</div>
<svelte:window on:keydown={onEscCheck} />
