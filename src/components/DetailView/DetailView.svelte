<script>
  import { currentRegionInfo, signalCasesOrDeathOptions, currentDateObject } from '../../stores';
  import { fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../vega/Vega.svelte';
  import spec from './DetailView.json';
  import specCasesDeath from './DetailViewCasesDeath.json';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import { createEventDispatcher } from 'svelte';
  import { merge } from 'lodash-es';
  import { primaryValue } from '../../stores/constants';
  import EncodingOptions from '../EncodingOptions.svelte';

  const dispatch = createEventDispatcher();
  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  export let sensor;

  $: mapTitle =
    typeof sensor.mapTitleText === 'function' ? sensor.mapTitleText($signalCasesOrDeathOptions) : sensor.mapTitleText;

  $: hasRegion = Boolean($currentRegionInfo);
  $: data = $currentRegionInfo ? fetchTimeSlice(sensor, $currentRegionInfo.level, $currentRegionInfo.propertyId) : [];

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
              height: size.height - 40 - 70,
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
              height: 40,
              encoding: {
                tooltip: [{ title: sensor.name }],
              },
            },
          ],
        },
        title,
      );
  }

  $: patchSpec = generatePatch(sensor.isCasesOrDeath ? casesPatch : regularPatch);

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
    font-size: 0.88rem;
    position: absolute;
    right: 0;
    top: 0;
  }

  .encoding {
    padding-top: 0.5em;
  }
</style>

<div class="header">
  <h4>{sensor.name} in {$currentRegionInfo ? $currentRegionInfo.displayName : 'Unknown'}</h4>
  <h5>{mapTitle}</h5>
  <button class="pg-button close" on:click={() => dispatch('close')} title="Close this detail view">
    <IoIosClose />
  </button>
</div>
<div class="single-sensor-chart vega-wrapper">
  <Vega
    {data}
    spec={sensor.isCasesOrDeath ? specCasesDeath : spec}
    {patchSpec}
    noDataText={hasRegion ? 'No data available' : 'No location selected'}
    signals={{ currentDate: $currentDateObject }} />
</div>
<div class="encoding">
  <EncodingOptions center {sensor} />
</div>
<svelte:window on:keydown={onEscCheck} />
