<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { fetchRegionSlice, fetchTimeSlice, addMissing } from '../../data';
  import { DEFAULT_SURVEY_SENSOR, sensorMap, sensorList } from '../../stores/constants';
  import { generateLineChartSpec, signalPatches, resolveHighlightedDate } from '../../specs/lineSpec';
  import { currentDate, currentDateObject } from '../../stores';
  import debounce from 'lodash-es/debounce';
  import { combineSignals } from '../../data/utils';
  import { stateInfo } from '../../maps';

  const cases = sensorList.find((d) => d.isCasesOrDeath);
  const masks = sensorMap.get(DEFAULT_SURVEY_SENSOR);

  function genGapMinder() {
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      padding: { left: 50, top: 16, bottom: 20, right: 100 },
      autosize: {
        type: 'none',
        contains: 'padding',
        resize: true,
      },
      data: {
        name: 'values',
      },
      transform: [
        {
          calculate: 'upper(datum.geo_value)',
          as: 'propertyId',
        },
        {
          lookup: 'propertyId',
          from: {
            data: { values: stateInfo },
            key: 'propertyId',
            fields: ['displayName', 'population', 'region'],
          },
        },
      ],
      encoding: {
        x: {
          field: 'cases',
          type: 'quantitative',
          axis: {
            grid: true,
            title: null,
            domain: false,
            tickCount: 5,
            labelFontSize: 14,
          },
          scale: {
            round: true,
            zero: false,
            domainMin: null,
          },
        },
        y: {
          field: 'masks',
          type: 'quantitative',
          axis: {
            grid: true,
            title: null,
            domain: false,
            tickCount: 5,
            labelFontSize: 14,
          },
          scale: {
            round: true,
            zero: false,
            domainMin: null,
          },
        },
      },
      layer: [
        {
          mark: {
            type: 'point',
            stroke: null,
            tooltip: true,
          },
          encoding: {
            size: {
              field: 'population',
              type: 'quantitative',
            },
            fill: {
              field: 'region',
              type: 'nominal',
            },
          },
        },
        {
          mark: {
            type: 'text',
            dx: 4,
            dy: -4,
            align: 'left',
            baseline: 'bottom',
          },
          encoding: {
            text: {
              field: 'propertyId',
              type: 'nominal',
            },
          },
        },
      ],
      config: {
        customFormatTypes: true,
        view: {
          stroke: null,
        },
      },
    };
    return spec;
  }

  $: gapMinderSpec = genGapMinder();

  const lineSpec = generateLineChartSpec({ height: 150, initialDate: $currentDateObject, valueField: 'count' });

  const casesData = fetchTimeSlice(cases, 'nation', 'us').then((r) => addMissing(r, cases));
  // const masksData = fetchTimeSlice(masks, 'nation', 'us').then((r) => addMissing(r, cases));

  function loadGapMinderData(date) {
    return Promise.all([fetchRegionSlice(cases, 'state', date), fetchRegionSlice(masks, 'state', date)]).then(
      (rows) => {
        return combineSignals(rows, rows[0], ['cases', 'masks']);
      },
    );
  }

  $: data = loadGapMinderData($currentDateObject);

  const lazyUpdate = debounce((value) => {
    currentDate.set(value);
  }, 1000);

  function onSignal(event) {
    if (event.detail.name === 'highlight') {
      const date = resolveHighlightedDate(event);
      if (date) {
        lazyUpdate(date);
      }
    }
  }
</script>

<div class="uk-container root">
  <h2>Masks vs Cases</h2>
  <!-- <h3>Masks</h3>
  <Vega spec={lineSpec} data={masksData} signalListeners={['highlight']} signals={signalPatches} on:signal={onSignal} /> -->
  <h3>Cases (count)</h3>
  <Vega spec={lineSpec} data={casesData} signalListeners={['highlight']} signals={signalPatches} on:signal={onSignal} />
  <h3>Masks (percentage) vs Cases (per 100k)</h3>
  <Vega spec={gapMinderSpec} {data} className="gapminder" />
</div>

<style>
  .root {
    display: flex;
    flex-direction: column;
    margin: 0;
  }
  .root > :global(.gapminder) {
    height: 500px;
  }
</style>
