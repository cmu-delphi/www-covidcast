<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchRegionSlice } from '../../data';
  import { currentDateObject, sensorMap } from '../../stores';
  import { combineSignals } from '../../data/utils';
  import { stateInfo } from '../../maps';
  import { onMount } from 'svelte';

  const masks = sensorMap.get('fb-survey-smoothed_wearing_mask');
  const cli = sensorMap.get('fb-survey-smoothed_cli');
  const hospital = sensorMap.get('hospital-admissions-smoothed_adj_covid19_from_claims');
  const deaths = sensorMap.get('indicator-combination-deaths_7dav_incidence_prop');
  const cases = sensorMap.get('indicator-combination-confirmed_7dav_incidence_prop');
  const vaccine = sensorMap.get('fb-survey-smoothed_covid_vaccinated_or_accept');

  const NAME_INFO_KEYS = ['propertyId', 'displayName', 'population', 'state'];

  function loadData(entries, date) {
    return Promise.all(entries.map((d) => fetchRegionSlice(d[1], 'state', date))).then((rows) => {
      return combineSignals(
        rows,
        rows[0],
        entries.map((d) => d[0]),
      );
    });
  }

  function generatePCPSpec(entries) {
    function asScale(field, i) {
      /**
       * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
       */
      const layer = {
        mark: 'rule',
        encoding: {
          x: { value: 0 },
          opacity: { value: 0 },
          y: {
            field,
            type: 'quantitative',
            scale: {
              zero: false,
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
          detail: { field: 'geo_value' },
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
        right: 40,
        top: 5,
        bottom: 5,
      },
      autosize: {
        type: 'none',
        contains: 'padding',
        resize: true,
      },
      data: { name: 'values', values: [] },
      transform: [
        {
          calculate: 'upper(datum.geo_value)',
          as: 'id',
        },
        {
          lookup: 'id',
          from: {
            data: { values: stateInfo },
            key: 'propertyId',
            fields: NAME_INFO_KEYS,
          },
        },
      ],
      layer: [
        ...entries.map((d, i) => asScale(d[0], i)),
        {
          transform: [
            {
              calculate: JSON.stringify(entries.map((d) => d[0])),
              as: 'x',
            },
            {
              calculate: `[${entries.map((d, i) => `height - scale('layer_${i}_y', datum.${d[0]})`).join(', ')}]`,
              as: 'y',
            },
            {
              flatten: ['x', 'y'],
            },
          ],
          mark: {
            type: 'line',
            point: true,
          },

          selection: {
            highlight: {
              type: 'single',
              on: 'mouseover, click',
              empty: 'none',
              fields: ['geo_value'],
            },
          },
          encoding: {
            opacity: {
              condition: {
                selection: 'highlight',
                value: 1,
              },
              value: 0.1,
            },
            x: {
              sort: null,
              field: 'x',
              type: 'nominal',
              scale: {
                type: 'point',
                padding: 0,
                domain: entries.map((d) => d[0]),
              },
              axis: null,
            },
            y: {
              field: 'y',
              type: 'quantitative',
              axis: null,
            },
            detail: { field: 'geo_value' },
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

  const entries = Object.entries({ masks, cli, cases, hospital, deaths, vaccine });

  let sortedEntries = entries;
  $: spec = generatePCPSpec(sortedEntries);
  $: data = loadData(entries, $currentDateObject);

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
      const geoValue = (e.detail.value.geo_value || [])[0];
      highlighted = geoValue ? e.detail.view.data('data_0').find((d) => d.geo_value === geoValue) : null;
    }
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

  <p>Drag the axis label chips to reorder:</p>

  <div data-uk-sortable class="c" bind:this={ref}>
    {#each entries as entry, i}
      <div class="s" data-i={i}>{entry[1].name}</div>
    {/each}
  </div>
  <Vega {spec} {data} signalListeners={['highlight']} on:signal={onSignal} />

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
      {#each entries as entry, i}
        <tr>
          <td>{entry[1].name}</td>
          <td>{highlighted ? entry[1].formatValue(highlighted[entry[0]]) : ''}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
