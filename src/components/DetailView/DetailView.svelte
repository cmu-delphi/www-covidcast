<script>
  import { currentRegionInfo, signalCasesOrDeathOptions, currentDateObject, smallMultipleTimeSpan } from '../../stores';
  import { addMissing, fetchTimeSlice } from '../../data/fetchData';
  import Vega from '../Vega.svelte';
  import spec from './DetailView.json';
  import specCasesDeath from './DetailViewCasesDeath.json';
  import specStdErr from './DetailViewStdErr.json';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { merge } from 'lodash-es';
  import { levelMegaCounty, primaryValue } from '../../stores/constants';
  import EncodingOptions from '../EncodingOptions.svelte';
  import { trackEvent } from '../../stores/ga';

  const dispatch = createEventDispatcher();
  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  export let sensor;

  $: mapTitle =
    typeof sensor.mapTitleText === 'function' ? sensor.mapTitleText($signalCasesOrDeathOptions) : sensor.mapTitleText;

  $: hasRegion = Boolean($currentRegionInfo);
  $: isMegaRegion = Boolean($currentRegionInfo) && $currentRegionInfo.level === levelMegaCounty.id;
  $: noDataText = hasRegion ? (isMegaRegion ? `Please select a county` : 'No data available') : 'No location selected';
  $: data = $currentRegionInfo
    ? fetchTimeSlice(sensor, $currentRegionInfo.level, $currentRegionInfo.propertyId).then(addMissing)
    : [];

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
        layer: [
          {
            selection: {
              brush: {
                init: {
                  x: [$smallMultipleTimeSpan[0].getTime(), $smallMultipleTimeSpan[1].getTime()],
                },
              },
            },
          },
        ],
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
        layer: [
          {},
          {
            selection: {
              brush: {
                init: {
                  x: [$smallMultipleTimeSpan[0].getTime(), $smallMultipleTimeSpan[1].getTime()],
                },
              },
            },
          },
        ],
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
      trackEvent('detail-view', 'close', 'keyboard');
      dispatch('close');
    }
  }

  let close = null;

  onMount(() => {
    if (close) {
      close.focus();
    }
  });
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
  <button
    bind:this={close}
    class="pg-button close"
    on:click={() => {
      trackEvent('detail-view', 'close', 'button');
      dispatch('close');
    }}
    title="Close this detail view">
    <IoIosClose />
  </button>
</div>
<div class="single-sensor-chart vega-wrapper">
  <Vega
    {data}
    spec={sensor.isCasesOrDeath ? specCasesDeath : sensor.hasStdErr ? specStdErr : spec}
    {patchSpec}
    {noDataText}
    signals={{ currentDate: $currentDateObject }} />
</div>
<div class="encoding">
  <EncodingOptions center {sensor} />
</div>
<svelte:window on:keydown={onEscCheck} />
