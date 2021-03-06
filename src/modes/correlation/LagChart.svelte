<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { BASE_SPEC, guessTopPadding, joinTitle } from '../../specs/commonSpec';
  import { autoAlign, COLOR, genCreditsLayer, signalPatches, resolveHighlightedField } from '../../specs/lineSpec';
  import { isMobileDevice } from '../../stores';
  import Toggle from '../../components/Toggle.svelte';
  import WarningBanner from '../../components/WarningBanner.svelte';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import { createEventDispatcher } from 'svelte';

  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let primary;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let secondary;

  export let lag = 0;

  /**
   * @type {import("../../data/correlation").EpiDataCorrelationRow[]}
   */
  export let lags;

  /**
   * @type {number}
   */
  let highlightedLag = lag;

  $: {
    // auto update
    highlightedLag = lag;
  }

  const dispatch = createEventDispatcher();

  function generateSpec(secondary, { title, subTitle, zero } = {}) {
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      ...BASE_SPEC,
      width: 500,
      height: 100,
      padding: { top: guessTopPadding(title, subTitle, 20), left: 42, bottom: 50, right: 8 },
      title: {
        text: title,
        subtitle: subTitle,
      },
      layer: [
        {
          encoding: {
            x: {
              field: 'lag',
              type: 'quantitative',
              scale: {
                nice: false,
              },
              axis: {
                title: `Lag (days) applied to ${secondary.name}`,
                labelOverlap: true,
              },
            },
            y: {
              field: 'r2',
              type: 'quantitative',
              scale: {
                zero,
                domainMax: zero ? 1 : undefined,
              },
              axis: {
                grid: true,
                title: null,
                domain: false,
                tickCount: 5,
                labelFontSize: 14,
              },
            },
          },
          layer: [
            {
              mark: {
                type: 'line',
                point: false,
              },
            },
            {
              mark: {
                type: 'point',
                color: 'transparent',
                stroke: null,
                tooltip: false,
              },
              params: [
                {
                  name: 'highlight',
                  select: {
                    type: 'point',
                    clear: false,
                    on: `click, mousemove, [touchstart, touchend] > touchmove`,
                    encodings: ['x'],
                    nearest: true,
                  },
                  value: {
                    lag: highlightedLag,
                  },
                },
              ],
              encoding: {
                opacity: {
                  condition: {
                    param: 'highlight',
                    empty: false,
                    value: 1,
                  },
                  value: 0,
                },
              },
            },
          ],
        },
        genCreditsLayer({ shift: 50 }),
        {
          transform: [
            {
              filter: {
                param: 'highlight',
                empty: false,
              },
            },
            {
              sample: 1,
            },
          ],
          encoding: {
            x: {
              field: 'lag',
              type: 'quantitative',
            },
          },
          layer: [
            {
              mark: {
                type: 'rule',
                stroke: COLOR,
                strokeDash: [2, 4],
                y: -4,
              },
            },
            {
              mark: {
                type: 'text',
                align: autoAlign('lag'),
                color: COLOR,
                baseline: 'bottom',
                fontSize: 16,
                dy: -3,
                text: {
                  expr: `format(datum.r2, '.2f', 'cachedNumber') + lagToOffset(datum.lag)`,
                },
                y: 0,
              },
            },
          ],
        },
      ],
    };
    return spec;
  }

  let scaled = false;
  $: spec = generateSpec(secondary, {
    zero: !scaled,
    title: joinTitle([`R² between "${primary.name}" and`, `lagged "${secondary.name}"`], $isMobileDevice),
  });

  let vegaRef = null;

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const lag = resolveHighlightedField(event, 'lag');
      if (highlightedLag !== lag && highlightedLag != null && lag != null) {
        dispatch('highlight', lag);
      }
      highlightedLag = lag;
    }
  }
</script>

{#await lags}
  <!-- dummy -->
{:catch error}
  <WarningBanner>
    {error.message}
  </WarningBanner>
{/await}

<div class="chart-150">
  <Vega
    data={lags}
    {spec}
    bind:this={vegaRef}
    signals={signalPatches}
    signalListeners={['highlight']}
    on:signal={onSignal}
  />
</div>
<div class="buttons">
  <Toggle bind:checked={scaled}>Rescale Y-axis</Toggle>
  <div class="spacer" />
  <DownloadMenu
    fileName="Correlation_Lag_vs_R2_{primary.name}_{secondary.name}"
    {vegaRef}
    data={lags}
    prepareRow={(r) => r}
    advanced={false}
  />
</div>

<style>
  .buttons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .spacer {
    flex: 1 1 0;
  }
</style>
