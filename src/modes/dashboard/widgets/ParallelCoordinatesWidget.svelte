<script>
  import Vega from '../../../components/vega/Vega.svelte';
  import WidgetCard from './WidgetCard.svelte';
  import { getContext, onMount } from 'svelte';
  import { getLevelInfo, stats } from '../../../stores';
  import { combineSignals } from '../../../data/utils';
  import { formatDateISO } from '../../../formats';
  import { addNameInfos } from '../../../data';
  import { SensorParam } from '../../../stores/params';
  import { BASE_SPEC, commonConfig } from '../../../specs/commonSpec';
  import { genCreditsLayer, resolveHighlightedField } from '../../../specs/lineSpec';
  import { highlightToRegions, WidgetHighlight } from '../highlight';
  import { getInfoByName } from '../../../data/regions';
  import isEqual from 'lodash-es/isEqual';
  import DownloadMenu from '../../../components/DownloadMenu.svelte';

  /**
   * @type {import("../../../stores/params").SensorParam[]}
   */
  export let sensors;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionLevel}
   */
  export let level;

  /**
   * @type {'auto' | 'mean' | 'full'}
   */
  export let domain = 'auto';

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  /**
   * @type {import("../../../stores/params").DataFetcher}
   */
  const fetcher = getContext('fetcher');

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
  /**
   * @param {Entry[]} entries
   * @param {import('../../../stores/params').Sensor[]} sensors
   * @param {import('../../../stores/params').RegionLevel} level
   * @param {'auto' | 'mean' | 'full'} domain
   */
  function generateSpec(entries, level, domain, reversedSet) {
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
              value: level === 'state' ? 0.25 : 0.1,
            },
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

  function deriveDomain(domain, entry) {
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

  function toEntry(sensor, statsLookup, level) {
    const param = new SensorParam(sensor);
    const stats = param.stats(statsLookup, level);
    const domain = param.domain(statsLookup, level);
    return {
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
   * @param {Entry[]} entries
   * @param {import("../../stores/params").RegionLevel} level
   * @param {import("../../stores/params").DateParam} date
   */
  function loadData(entries, level, date) {
    return Promise.all(entries.map((entry) => fetcher.fetch1SensorNRegions1Date(entry.sensor, level, '*', date)))
      .then((rows) => {
        return combineSignals(
          rows,
          rows[0].map((d) => ({ ...d })), // combine to copy
          entries.map((d) => d.id),
        );
      })
      .then(addNameInfos)
      .then((rows) => {
        // add a mean line
        const meanEntry = {
          id: 'mean',
          region: 'Mean Value',
          displayName: 'Mean from Metadata',
        };
        entries.forEach((entry) => {
          meanEntry[entry.id] = entry.mean;
        });
        rows.push(meanEntry);
        return rows;
      });
  }

  $: shownLevel = level === 'nation' ? 'state' : level;
  $: entries = sensors.map((sensor) => toEntry(sensor, $stats, shownLevel));

  let reversedSet = [];
  $: sortedEntries = entries;

  $: spec = generateSpec(sortedEntries, shownLevel, domain, reversedSet);
  $: data = loadData(entries, shownLevel, date);
  $: fileName = `Indicators_${getLevelInfo(shownLevel).labelPlural}_${formatDateISO(date.value)}`;

  let ref = null;

  onMount(() => {
    ref.addEventListener('moved', (e) => {
      const order = Array.from(e.target.querySelectorAll('.s')).map((d) => Number.parseInt(d.dataset.i, 10));
      sortedEntries = order.map((i) => entries[i]);
    });
  });

  let vegaRef = null;

  function onHighlightSignal(event) {
    const id = resolveHighlightedField(event, 'id');
    if (id) {
      const newHighlight = new WidgetHighlight(sensors, getInfoByName(id, shownLevel), date.value);
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
    const regions = highlightToRegions(shownLevel, highlight);
    const values = regions && regions.length > 0 ? [regions[0].id] : null;
    const newValue =
      regions && regions.length > 0
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

  /**
   * @param {import("../../../stores/params").Sensor} sensor
   * @param {import('../highlight').WidgetHighlight | null} highlight
   */
  function isHighlighted(sensor, shownLevel, date, highlight) {
    return highlight && highlight.matches(sensor, shownLevel, date);
  }
</script>

<WidgetCard
  grid={{ width: 2, height: 3 }}
  sensor="Indicators"
  region="US {getLevelInfo(shownLevel).labelPlural}"
  {date}
>
  <div class="content">
    <div data-uk-sortable class="c" bind:this={ref}>
      {#each entries as entry, i}
        <div class="axis" data-i={i} class:highlight={isHighlighted(entry.sensor, shownLevel, date.value, highlight)}>
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
  }

  .axis.highlight,
  .axis:hover {
    box-shadow: 0 0 3px 0 #888;
  }
</style>
