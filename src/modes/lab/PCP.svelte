<script>
  import Vega from '../../components/Vega.svelte';
  import { addNameInfos, fetchRegionSlice } from '../../data';
  import { currentDateObject, sensorMap } from '../../stores';
  import { combineSignals } from '../../data/utils';
  import { onMount } from 'svelte';
  import Search from '../../components/Search.svelte';
  import { countyInfo, stateInfo } from '../../maps';

  const masks = sensorMap.get('fb-survey-smoothed_wearing_mask');
  const cli = sensorMap.get('fb-survey-smoothed_cli');
  const hospital = sensorMap.get('hospital-admissions-smoothed_adj_covid19_from_claims');
  const deaths = sensorMap.get('indicator-combination-deaths_7dav_incidence_prop');
  const cases = sensorMap.get('indicator-combination-confirmed_7dav_incidence_prop');
  const vaccine = sensorMap.get('fb-survey-smoothed_covid_vaccinated_or_accept');

  function loadData(entries, date, level) {
    return Promise.all(entries.map((d) => fetchRegionSlice(d.signal, level, date)))
      .then((rows) => {
        return combineSignals(
          rows,
          rows[0],
          entries.map((d) => d.name),
        );
      })
      .then(addNameInfos);
  }

  const entries = [
    {
      name: 'vaccine',
      signal: vaccine,
    },
    {
      name: 'masks',
      signal: masks,
    },
    {
      name: 'cli',
      signal: cli,
    },
    {
      name: 'cases',
      signal: cases,
    },
    {
      name: 'hospital',
      signal: hospital,
    },
    {
      name: 'deaths',
      signal: deaths,
    },
  ];

  let reversedSet = [];

  function generatePCPSpec(entries, level, reversedSet) {
    function asScale(entry, i) {
      /**
       * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
       */
      const layer = {
        mark: 'rule',
        encoding: {
          x: { value: 0 },
          opacity: { value: 0 },
          y: {
            field: entry.name,
            type: 'quantitative',
            scale: {
              zero: false,
              reverse: reversedSet.includes(entry.name),
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
      width: 100,
      height: 500,
      padding: {
        left: 40,
        right: 40 + 60,
        top: 5,
        bottom: 5,
      },
      autosize: {
        type: 'none',
        contains: 'padding',
        resize: true,
      },
      data: { name: 'values', values: [] },
      layer: [
        ...entries.map((d, i) => asScale(d, i)),
        {
          transform: [
            {
              calculate: JSON.stringify(entries.map((d) => d.name)),
              as: 'x',
            },
            {
              calculate: `[${entries.map((d, i) => `height - scale('layer_${i}_y', datum.${d.name})`).join(', ')}]`,
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

          selection: {
            highlight: {
              type: 'single',
              on: 'mouseover, click',
              empty: 'none',
              fields: ['id'],
            },
          },
          encoding: {
            opacity: {
              condition: {
                selection: 'highlight',
                value: 1,
              },
              value: level === 'state' ? 0.25 : 0.1,
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
              axis: null,
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
            },
          },
        },
      ],
      resolve: {
        scale: {
          y: 'independent',
        },
      },
      config: {
        padding: 0,
        view: {
          stroke: null,
        },
      },
    };
    return spec;
  }

  let level = 'state';
  let sortedEntries = entries;
  $: spec = generatePCPSpec(sortedEntries, level, reversedSet);
  $: data = loadData(entries, $currentDateObject, level);

  let ref = null;

  onMount(() => {
    ref.addEventListener('moved', (e) => {
      const order = Array.from(e.target.querySelectorAll('.s')).map((d) => Number.parseInt(d.dataset.i, 10));
      sortedEntries = order.map((i) => entries[i]);
    });
  });

  let highlighted = null;

  function onSignal(e) {
    if (e.detail.name === 'highlight') {
      const id = (e.detail.value.id || [])[0];
      highlighted = id ? e.detail.view.data('values').find((d) => d.id === id) : null;
    }
  }

  /**
   * @param {import('../../maps').NameInfo} d
   */
  function combineKeywords(d) {
    return `${d.id} ${d.displayName}`;
  }

  /**
   * @type {Vega}
   */
  let vega = null;

  function onHighlight(info) {
    /**
     * @type {import('vega-typings').View}
     */
    const view = vega.vegaDirectAccessor();
    if (!view) {
      return;
    }
    highlighted = info ? view.data('values').find((d) => d.id === info.id) : null;
    view.signal(
      'highlight_tuple',
      info
        ? {
            unit: 'layer_1',
            fields: view.signal('highlight_tuple_fields'),
            values: [info.id],
          }
        : null,
    );
    view.runAsync();
  }
</script>

<style>
  .c {
    display: flex;
    justify-content: space-between;
  }
  .s {
    font-size: 10px;
    border: 1px solid #efefef;
    border-radius: 5px;
    cursor: grab;
    margin-right: 60px;
    padding: 2px 5px;
    flex: 1 1 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .s:hover {
    background: #efefef;
  }

  .uk-container > :global(.vega-embed) {
    display: block;
    margin: 0 10px;
  }
</style>

<div class="uk-container">
  <h2>Parallel Coordinates Plot of States</h2>
  <div>
    Granuarlity:
    <label><input type="radio" value="state" name="level" bind:group={level} />State</label>
    <label><input type="radio" value="county" name="level" bind:group={level} />County</label>
  </div>

  <Search
    modern="small"
    placeholder="Search for {level}"
    items={level === 'state' ? stateInfo : countyInfo}
    selectedItem={level === 'state' ? null : null}
    labelFieldName="displayName"
    keywordFunction={combineKeywords}
    maxItemsToShowInList="5"
    on:change={(e) => onHighlight(e.detail)} />

  <p>Drag the axis label chips to reorder:</p>

  <div data-uk-sortable class="c" bind:this={ref}>
    {#each entries as entry, i}
      <div class="s" data-i={i}>
        {entry.signal.name}
        <label><input type="checkbox" name="reverse" bind:group={reversedSet} value={entry.name} />Reverse</label>
      </div>
    {/each}
  </div>
  <Vega bind:this={vega} {spec} {data} signalListeners={['highlight']} on:signal={onSignal} />

  <h3 class="uk-margin-remove-top">Selected Item</h3>
  <table class="uk-table  uk-table-small">
    <caption>{highlighted ? highlighted.displayName : 'Nothing selected'}</caption>
    <thead>
      <tr>
        <th>Indicator</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {#each entries as entry}
        <tr>
          <td>{entry.signal.name}</td>
          <td>{highlighted ? entry.signal.formatValue(highlighted[entry.name]) : ''}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
