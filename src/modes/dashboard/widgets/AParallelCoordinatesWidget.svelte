<script context="module">
  /**
   * @typedef {object} Entry
   * @property {string} id
   * @property {string} name
   * @property {import('../../../stores/params').Sensor} sensor
   * @property {import('../../../stores/params').SensorParam} param
   * @property {[number, number]} domain
   * @property {number} mean
   * @property {number} max
   * @property {number} std
   */

  export function deriveDomain(domain, entry) {
    if (domain == 'defined') {
      return { domain: entry.domain, zero: false, nice: false, clamp: true };
    }
    if (domain === 'auto') {
      return { zero: false };
    }
    if (entry.param.isPercentage) {
      return { domain: [0, 100] };
    }
    return {};
  }

  export function toEntry(sensor, manager, level, index) {
    const param = new SensorParam(sensor, manager);
    const stats = param.manager.getStats(sensor, level);
    const domain = param.domain(level);
    return {
      index,
      id: sensor.key.replace(/[\s;:\-_()]+/gm, '_'),
      name: sensor.name,
      sensor,
      param,
      mean: stats.mean,
      max: stats.max,
      domain,
    };
  }
  /**
   * @type {{domain: 'auto' | 'defined' | 'full', sortedOrder: number[] | null, reversed: string[]}}
   */
  export const DEFAULT_STATE = {
    ...DEFAULT_WIDGET_STATE,
    width: 2,
    height: 3,
    domain: 'auto',
    sortedOrder: null,
    reversed: [],
  };
</script>

<script>
  import Vega from '../../../components/vega/Vega.svelte';
  import WidgetCard, { DEFAULT_WIDGET_STATE } from './WidgetCard.svelte';
  import { onMount } from 'svelte';
  import { SensorParam } from '../../../stores/params';
  import { BASE_SPEC, commonConfig } from '../../../specs/commonSpec';
  import { genCreditsLayer, resolveHighlightedField } from '../../../specs/lineSpec';
  import isEqual from 'lodash-es/isEqual';
  import DownloadMenu from '../../../components/DownloadMenu.svelte';
  import OptionPicker from '../../../components/OptionPicker.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let id = undefined;
  /**
   * @type {Entry[]}
   */
  export let entries;
  /**
   * @type {import("../../../stores/params").DateParam | string}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionParam | string}
   */
  export let region;

  export let data = Promise.resolve([]);
  export let fileName = '';

  export let isSensorHighlighted = () => false;

  export let initialState = DEFAULT_STATE;

  let reversedSet = initialState.reversed || [];
  let sortedOrder = null;
  let domain = initialState.domain || 'auto';
  let superState = {};
  $: state = {
    ...initialState,
    ...superState,
    domain,
    sortedOrder,
    reversed: reversedSet,
  };
  $: {
    // dispatch state changes
    dispatch('state', { id, state });
  }

  function mergeState(event) {
    superState = event.detail.state;
  }

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  /**
   * @param {Entry[]} entries
   * @param {import('../../../stores/params').Sensor[]} sensors
   * @param {import('../../../stores/params').RegionLevel} level
   * @param {'auto' | 'defined' | 'full'} domain
   */
  function generateSpec(entries, domain, reversedSet, { opacity = 0.25, colorBy = 'region' }) {
    /**
     * @param {Entry} entry
     * @param {number} i
     */
    function asScale(entry, i) {
      /**
       * @type {import('vega-lite/build/src/spec').NormalizedUnitSpec | import('vega-lite/build/src/spec').NormalizedLayerSpec}
       */
      const layer = {
        mark: 'rule',
        encoding: {
          x: { value: 0 },
          opacity: { value: 0 },
          y: {
            field: entry.id,
            type: 'quantitative',
            scale: {
              ...deriveDomain(domain, entry),
              reverse: reversedSet.includes(entry.id),
            },
            axis: {
              grid: false,
              title: null,
              orient: i > 0 ? 'right' : 'left',
              format: entry.sensor.formatSpecifier,
              offset:
                i > 0 && i < entries.length - 1
                  ? {
                      expr: `${entries.length - 1 - i} * -width / ${entries.length - 1}`,
                    }
                  : 0,
            },
          },
          detail: { field: 'id' },
        },
      };
      return layer;
    }
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      ...BASE_SPEC,
      padding: {
        left: 40,
        right: 40,
        top: 20,
        bottom: 50,
      },
      layer: [
        ...entries.map((d, i) => asScale(d, i)),
        {
          transform: [
            {
              calculate: JSON.stringify(entries.map((d) => d.name)),
              as: 'x',
            },
            {
              calculate: `[${entries.map((d, i) => `height - scale('layer_${i}_y', datum.${d.id})`).join(', ')}]`,
              as: 'y',
            },
            {
              flatten: ['x', 'y'],
            },
          ],
          mark: {
            type: 'line',
            point: false,
          },
          params: [
            {
              name: 'highlight',
              select: {
                type: 'point',
                on: 'mouseover, click',
                fields: ['id'],
              },
            },
          ],
          encoding: {
            x: {
              sort: null,
              field: 'x',
              type: 'nominal',
              scale: {
                type: 'point',
                padding: 0,
                domain: entries.map((d) => d.name),
              },
              axis: {
                labelAngle: 0,
                // labelAlign: {
                //   expr: `datum.index === 0 ? 'left' : (datum.index === ${entries.length - 1} ? 'right' : 'center')`,
                // },
                ticks: false,
                offset: 5,
                orient: 'top',
                domain: false,
                title: null,
              },
              // axis: null,
            },
            y: {
              field: 'y',
              type: 'quantitative',
              axis: null,
            },
            detail: { field: 'id' },
            strokeWidth: {
              condition: {
                test: {
                  or: [
                    {
                      param: 'highlight',
                      empty: false,
                    },
                    'datum.id === "mean"',
                  ],
                },
                value: 3,
              },
              value: 1,
              legend: {
                direction: 'horizontal',
                orient: 'bottom',
                title: null,
                titleFontWeight: 'normal',
              },
            },
            ...(colorBy === 'region'
              ? {
                  opacity: {
                    condition: {
                      test: {
                        or: [
                          {
                            param: 'highlight',
                            empty: false,
                          },
                          'datum.id === "mean"',
                        ],
                      },
                      value: 1,
                    },
                    value: opacity,
                  },
                  color: {
                    field: 'region',
                    type: 'nominal',
                    legend: {
                      direction: 'horizontal',
                      orient: 'bottom',
                      title: null,
                      titleFontWeight: 'normal',
                    },
                  },
                }
              : {
                  opacity: {
                    condition: {
                      test: {
                        or: [
                          {
                            param: 'highlight',
                            empty: false,
                          },
                          'datum.id === "mean"',
                        ],
                      },
                      value: 1,
                    },
                    field: 'date_value',
                    type: 'temporal',
                    scale: {
                      range: [0.05, 0.6],
                    },
                    legend: {
                      direction: 'horizontal',
                      orient: 'bottom',
                      title: null,
                      titleFontWeight: 'normal',
                    },
                  },
                }),
          },
        },
        genCreditsLayer({ shift: 50 }),
      ],
      resolve: {
        scale: {
          y: 'independent',
        },
      },
      config: {
        ...commonConfig,
        padding: 0,
      },
    };
    return spec;
  }

  $: initialSortedEntries = (initialState || {}).sortedOrder
    ? initialState.sortedOrder.map((i) => entries[i])
    : entries;
  $: sortedEntries = initialSortedEntries;
  export let options = {};

  $: spec = generateSpec(sortedEntries, domain, reversedSet, options);

  let ref = null;

  onMount(() => {
    ref.addEventListener('moved', (e) => {
      const order = Array.from(e.target.querySelectorAll('.axis')).map((d) => Number.parseInt(d.dataset.i, 10));
      sortedOrder = order;
      sortedEntries = order.map((i) => entries[i]);
    });
  });

  let vegaRef = null;

  export let highlightToSpecId = () => null;
  export let specIdToHighlight = () => null;

  function onHighlightSignal(event) {
    const id = resolveHighlightedField(event, 'id');
    const newHighlight = id === 'mean' ? null : specIdToHighlight(id);
    if (newHighlight) {
      if (!newHighlight.equals(highlight)) {
        highlight = newHighlight;
      }
    } else {
      if (highlight != null) {
        highlight = null;
      }
    }
  }

  function updateVegaHighlight(highlight) {
    if (!vegaRef) {
      return;
    }
    const view = vegaRef.vegaDirectAccessor();
    if (!view) {
      return;
    }
    const value = highlightToSpecId(highlight);
    const values = value != null ? [value] : null;
    const newValue =
      value != null
        ? {
            unit: 'layer_1',
            fields: view.signal('highlight_tuple_fields'),
            values,
          }
        : null;
    const currentValues = (view.signal('highlight_tuple') || { values: [] }).values;
    const newValues = values || [];
    if (isEqual(currentValues, newValues)) {
      return;
    }
    view.signal('highlight_tuple', newValue);
    view.runAsync();
  }
  $: {
    updateVegaHighlight(highlight);
  }
</script>

<WidgetCard
  sensor="Indicators"
  {region}
  {date}
  {id}
  on:action
  {initialState}
  defaultState={DEFAULT_STATE}
  on:state={mergeState}
>
  <div class="content">
    <div data-uk-sortable class="c" bind:this={ref}>
      {#each initialSortedEntries as entry}
        <div class="axis" data-i={entry.index} class:highlight={isSensorHighlighted(entry.sensor, highlight)}>
          <div>{entry.name}</div>
          <div>{entry.param.unitShort}</div>
          <label><input type="checkbox" name="reverse" bind:group={reversedSet} value={entry.id} />Reverse</label>
        </div>
      {/each}
    </div>
    <Vega
      style="flex-grow: 1; margin-top: -12px;"
      bind:this={vegaRef}
      {spec}
      {data}
      signalListeners={['highlight']}
      on:signal_highlight={onHighlightSignal}
    />
  </div>
  <svelte:fragment slot="toolbar">
    <OptionPicker bind:value={domain} label="Domain">
      <option value="auto">Auto</option>
      <option value="defined">Mean±3*Std</option>
      <option vlaue="full">Full Range</option>
    </OptionPicker>
    <DownloadMenu {fileName} {vegaRef} {data} advanced={false} />
  </svelte:fragment>
</WidgetCard>

<style>
  .content {
    display: flex;
    flex-direction: column;
  }

  .c {
    background: white;
    z-index: 1;
    padding: 5px 0 2px 0;
    display: flex;
    justify-content: space-between;
    position: relative;
  }
  .axis {
    font-size: 0.75rem;
    border: 1px solid #efefef;
    border-radius: 5px;
    cursor: grab;
    padding: 2px 5px;
    margin: 0 2px;
    flex: 1 1 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: white;
  }

  .axis.highlight,
  .axis:hover {
    box-shadow: 0 0 3px 0 #888;
  }
</style>
