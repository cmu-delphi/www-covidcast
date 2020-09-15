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
  import IoIosSave from 'svelte-icons/io/IoIosSave.svelte';
  import { downloadUrl } from '../../data/screenshot';
  import { trackEvent } from '../../stores/ga';
  import VegaTooltip from './VegaTooltip.svelte';

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
    ? fetchTimeSlice(sensor, $currentRegionInfo.level, $currentRegionInfo.propertyId, undefined, undefined, false, {
        geo_value: $currentRegionInfo.propertyId,
      }).then(addMissing)
    : [];

  export let download = false;

  $: regularPatch = {
    vconcat: [
      {
        encoding: {
          y: {
            axis: {
              title: sensor.yAxis || '',
            },
          },
        },
      },
      {
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
              width: size.width - 45 - 20,
              height: size.height - 40 - 70 - 20,
              encoding: {
                y: {
                  axis: {
                    title: sensor.yAxis || '',
                  },
                },
              },
            },
            {
              width: size.width - 45 - 20,
              height: 40,
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

  let vegaRef = null;

  function downloadVega() {
    vegaRef.vegaAccessor().then((view) => {
      const png = view.toImageURL('png', 2);
      png.then((url) => {
        downloadUrl(url, `${sensor.name} in ${$currentRegionInfo ? $currentRegionInfo.displayName : 'Unknown'}.png`);
      });
    });
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
  .close > * {
    display: inline-block;
  }

  .encoding {
    padding-top: 0.5em;
  }
</style>

{#if !download}
  <div class="header">
    <h4>{sensor.name} in {$currentRegionInfo ? $currentRegionInfo.displayName : 'Unknown'}</h4>
    <h5>{mapTitle}</h5>
    <div class="close">
      <button class="pg-button" on:click={downloadVega} disabled={!vegaRef} title="Download this view">
        <IoIosSave />
      </button>
      <button
        bind:this={close}
        class="pg-button"
        on:click={() => {
          trackEvent('detail-view', 'close', 'button');
          dispatch('close');
        }}
        title="Close this detail view">
        <IoIosClose />
      </button>
    </div>
  </div>
{/if}
<div class="single-sensor-chart vega-wrapper">
  <Vega
    bind:this={vegaRef}
    {data}
    spec={sensor.isCasesOrDeath ? specCasesDeath : sensor.hasStdErr ? specStdErr : spec}
    {patchSpec}
    {noDataText}
    signals={{ currentDate: $currentDateObject }}
    on:ready={() => dispatch('ready')}
    tooltip={VegaTooltip}
    tooltipProps={{ sensor }} />
</div>
{#if !download}
  <div class="encoding">
    <EncodingOptions center {sensor} />
  </div>
{/if}
<svelte:window on:keydown={onEscCheck} />
