<script>
  import { signalCasesOrDeathOptions, currentDateObject, smallMultipleTimeSpan } from '../../stores';
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
  import VegaTooltip from './VegaTooltip.svelte';

  const dispatch = createEventDispatcher();
  /**
   * @type {import('../../data/fetchData').SensorEntry}
   */
  export let sensor;

  $: mapTitle =
    typeof sensor.mapTitleText === 'function' ? sensor.mapTitleText($signalCasesOrDeathOptions) : sensor.mapTitleText;

  function fetchMulti(sensor, selections) {
    return Promise.all(
      selections.map((s) => {
        const region = s.info;
        if (region.level === levelMegaCounty.id) {
          return [];
        }
        return fetchTimeSlice(sensor, region.level, region.propertyId, undefined, undefined, false, {
          geo_value: region.propertyId,
        })
          .then(addMissing)
          .then((rows) =>
            rows.map((row) => {
              row.displayName = region.displayName;
              return row;
            }),
          );
      }),
    ).then((rows) => rows.flat());
  }
  /**
   * @type {{info: import('../../maps').NameInfo, color: string}[]}
   */
  export let selections = [];
  $: region = selections.length > 0 ? selections[0].info : null;
  $: hasRegion = selections.length > 0;
  $: multi = selections.length > 1;
  $: isMegaRegion = Boolean(region) && region.level === levelMegaCounty.id;
  $: noDataText = hasRegion ? (isMegaRegion ? `Please select a county` : 'No data available') : 'No location selected';
  $: data = multi
    ? fetchMulti(sensor, selections)
    : region && !isMegaRegion
    ? fetchTimeSlice(sensor, region.level, region.propertyId, undefined, undefined, false, {
        geo_value: region.propertyId,
      }).then(addMissing)
    : [];

  $: regularPatch = {
    vconcat: [
      {
        encoding: {
          y: {
            field: primaryValue(sensor, $signalCasesOrDeathOptions),
          },
        },
      },
      {
        layer: [
          {
            encoding: {
              y: {
                field: primaryValue(sensor, $signalCasesOrDeathOptions),
              },
            },
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
            field: primaryValue(sensor, $signalCasesOrDeathOptions),
          },
        },
        layer: [
          {
            encoding: {
              y: {
                field: primaryValue(sensor, $signalCasesOrDeathOptions).replace('avg', 'count'),
              },
            },
          },
        ],
      },
      {
        layer: [
          {
            encoding: {
              y: {
                field: primaryValue(sensor, $signalCasesOrDeathOptions).replace('avg', 'count'),
              },
            },
          },
          {
            encoding: {
              y: {
                field: primaryValue(sensor, $signalCasesOrDeathOptions),
              },
            },
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
              },
            },
            {
              width: size.width - 45,
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
  <h4>{sensor.name} in {region ? region.displayName : 'Unknown'}</h4>
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
    signals={{ currentDate: $currentDateObject }}
    tooltip={VegaTooltip}
    tooltipProps={{ sensor }} />
</div>
<div class="encoding">
  <EncodingOptions center {sensor} />
</div>
<svelte:window on:keydown={onEscCheck} />
