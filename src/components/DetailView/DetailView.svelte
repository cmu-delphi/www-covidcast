<script>
  import {
    currentRegion,
    currentLevel,
    currentRegionInfo,
    signalCasesOrDeathOptions,
    currentDateObject,
  } from '../../stores';
  import { fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../vega/Vega.svelte';
  import spec from './DetailView.json';
  import specCasesDeath from './DetailViewCasesDeath.json';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import { createEventDispatcher } from 'svelte';
  import { merge } from 'lodash-es';
  import { isCasesSignal, isDeathSignal } from '../../data';
  import { primaryValue } from '../../stores/constants';
  import EncodingOptions from '../EncodingOptions.svelte';

  const dispatch = createEventDispatcher();
  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  export let sensor;

  $: data = fetchTimeSlice(sensor, $currentLevel, $currentRegion);
  $: isCasesOrDeath = isCasesSignal(sensor.key) || isDeathSignal(sensor.key);

  $: regularPatch = {
    vconcat: [
      {
        encoding: {
          y: {
            axis: {
              title: sensor.yAxis || '',
            },
          },
          tooltip: [{ title: sensor.name }],
        },
      },
      {
        encoding: {
          y: {
            axis: {
              title: sensor.yAxis || '',
            },
          },
          tooltip: [{ title: sensor.name }],
        },
      },
    ],
  };
  $: casesPatch = {
    vconcat: [
      {
        encoding: {
          y: {
            field: primaryValue(sensor, $signalCasesOrDeathOptions).replace('avg', 'count'),
          },
          tooltip: [
            { title: sensor.name },
            {},
            { title: `${sensor.name} per 100k` },
            {},
            { title: `${sensor.name} (cumulated)` },
            {},
            { title: `${sensor.name}  per 100k (cumulated)` },
          ],
        },
        layer: [
          {}, // current date
          {}, // bars
          {
            // average line
            encoding: {
              y: {
                field: primaryValue(sensor, $signalCasesOrDeathOptions),
              },
            },
          },
        ],
      },
      {
        encoding: {
          y: {
            field: primaryValue(sensor, $signalCasesOrDeathOptions).replace('avg', 'count'),
          },
          tooltip: [{ title: sensor.name }],
        },
      },
    ],
  };

  function generatePatch(title) {
    return (spec, size) =>
      merge(
        {},
        spec,
        {
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
                tooltip: [{ title: sensor.name }],
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
                tooltip: [{ title: sensor.name }],
              },
            },
          ],
        },
        title,
      );
  }

  $: patchSpec = generatePatch(isCasesOrDeath ? casesPatch : regularPatch);

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
  <h4>{sensor.name} of {$currentRegionInfo ? $currentRegionInfo.displayName : 'Unknown'}</h4>
  <h5>{sensor.tooltipText}</h5>
  <button class="pg-button close" on:click={() => dispatch('close')} title="Close this detail view">
    <IoIosClose />
  </button>
  <EncodingOptions center {sensor} />
</div>
<div class="single-sensor-chart vega-wrapper">
  <Vega
    {data}
    spec={isCasesOrDeath ? specCasesDeath : spec}
    {patchSpec}
    signals={{ currentDate: $currentDateObject }} />
</div>
<svelte:window on:keydown={onEscCheck} />
