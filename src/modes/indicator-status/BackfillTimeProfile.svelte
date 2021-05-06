<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { loadBackFillProfile } from '../../data/indicatorInfo';
  import { commonConfig } from '../../specs/commonSpec';
  import { DateParam } from '../../stores/params';
  import DownloadMenu from '../../components/DownloadMenu.svelte';

  /**
   * @type {import('../../data/indicatorInfo').IndicatorStatus}
   */
  export let indicator;

  /**
   * @type {import('../../data/regions').Region}
   */
  export let region;

  /**
   * @type {Date}
   */
  export let date;

  export let referenceAnchorLag = 60;

  $: window = new DateParam(date).windowTimeFrame;

  $: data = loadBackFillProfile(indicator, region, window, referenceAnchorLag);

  function generateSpec(indicator) {
    const cont = (v) => `(datum.value_completeness >= 0.${v} && datum.prevCompleteness < 0.${v}) ? 'p${v}'`;
    const completenessClassifier = `${cont(90)} : (${cont(75)} : (${cont(50)} : (${cont(25)} : null)))`;

    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      autosize: {
        type: 'none',
        contains: 'padding',
        resize: true,
      },
      width: 100,
      height: 100,
      data: { name: 'values' },
      config: commonConfig,
      title: {
        text: `${indicator.name} Backfill Profile`,
      },
      padding: {
        left: 50,
        top: 100,
        right: 100,
        bottom: 70,
      },
      transform: [
        {
          window: [
            {
              op: 'lag',
              field: 'value_completeness',
              param: 1,
              as: 'prevCompleteness',
            },
          ],
          groupby: ['time_value'],
          sort: [
            {
              field: 'lag',
              order: 'ascending',
            },
          ],
        },
        {
          calculate: 'datum.prevCompleteness != null ? datum.prevCompleteness : 0',
          as: 'prevCompleteness',
        },
        {
          calculate: completenessClassifier,
          as: 'completed',
        },
      ],

      layer: [
        {
          mark: {
            type: 'rect',
            stroke: null,
            width: {
              expr: `width / customCountDays(domain('x')[0], domain('x')[1])`,
            },
            height: {
              expr: `height / (domain('y')[1] - domain('y')[0])`,
            },
            tooltip: {
              content: 'data',
            },
          },
          encoding: {
            color: {
              field: 'value_completeness',
              type: 'quantitative',
              scale: {
                domain: [0, 1],
                clamp: true,
                nice: false,
                scheme: 'viridis',
              },
              legend: {
                title: 'Completness',
                titleAlign: 'left',
                titleOrient: 'left',
                // gradientLength: 00,
              },
            },
          },
        },
      ],
      encoding: {
        x: {
          field: 'date_value',
          type: 'temporal',
          axis: {
            format: '%m/%d',
            formatType: 'cachedTime',
            labelOverlap: true,
            labelExpr: `datum.label + ((week(datum.value) === 1 || datum.index === 0) ? '/' + year(datum.value) : '')`,
            grid: true,
            gridDash: [4, 4],
            tickCount: 'week',
            // tickWidth: {
            //   condition: { test: { field: 'value', timeUnit: 'month', equal: 1 }, value: 3 },
            //   value: 1,
            // },
            title: 'Reported Date',
          },
        },
        y: {
          field: 'lag',
          type: 'quantitative',
          scale: {
            zero: true,
          },
          axis: {
            title: 'Lag',
          },
        },
      },
    };
    return spec;
  }

  $: spec = generateSpec(indicator);

  let vegaRef = undefined;
</script>

<div class="chart-300">
  <Vega bind:this={vegaRef} {spec} {data} className="chart-breakout" />
  <DownloadMenu {vegaRef} absolutePos fileName="{indicator.name}_Backfill_profile" advanced={false} />
</div>
