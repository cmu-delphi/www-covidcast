<script>
  // import type { TopLevelSpec } from 'vega-lite';
  // import type { NonNormalizedSpec, NormalizedSpec } from 'vega-lite/build/src/spec';
  import Vega from '../../components/Vega.svelte';
  import { loadBackFillProfile } from '../../data/indicatorInfo';
  // import type { IndicatorStatus } from ;
  import { commonConfig } from '../../specs/commonSpec';
  import { DateParam } from '../../stores/params';
  import DownloadMenu from '../mobile/components/DownloadMenu.svelte';

  /**
   * @type {import('../../data/indicatorInfo').IndicatorStatus}
   */
  export let indicator;
  /**
   * @type {Date}
   */
  export let date;

  $: window = new DateParam(date).windowTimeFrame;

  $: data = loadBackFillProfile(indicator, window);

  function generateLayer(field, title, i, maxConfidence) {
    /**
     * @type {import('vega-lite/build/src/spec').NonNormalizedSpec}
     */
    const spec = {
      width: 'container',
      height: 300,
      layer: [
        {
          mark: {
            type: 'rect',
            stroke: null,
            width: {
              expr: `width / customCountDays(domain('concat_${i}_x')[0], domain('concat_${i}_x')[1])`,
            },
            height: {
              expr: `childHeight / (domain('concat_${i}_y')[1] - domain('concat_${i}_y')[0])`,
            },
            tooltip: {
              content: 'data',
            },
          },
          encoding: {
            color: {
              field: 'confidence',
              type: 'quantitative',
              scale: {
                // type: 'pow',
                // exponent: 0.1,
                domainMax: maxConfidence,
                nice: false,
                scheme: 'viridis',
              },
              legend: {
                // gradientLength: 00,
              },
            },
          },
        },
      ],
      encoding: {
        x: {
          field: field,
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
            title: title,
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

  function generateStreamLayer(field, title) {
    /**
     * @type {import('vega-lite/build/src/spec').NonNormalizedSpec}
     */
    const spec = {
      width: 'container',
      height: 300,
      transform: [
        {
          filter: 'datum.completed != null',
        },
        {
          impute: 'lag',
          key: 'completed',
          groupby: ['time_value', 'date_value'],
          method: 'value',
          value: null,
        },
        {
          pivot: 'completed',
          groupby: ['time_value', 'date_value'],
          value: 'lag',
        },
      ],
      layer: [
        {
          transform: [
            {
              calculate: `['p25-p50', 'p50-p75', 'p75-p90']`,
              as: 'range',
            },
            {
              calculate: `[datum.p25, datum.p50, datum.p75]`,
              as: 'start',
            },
            {
              calculate: `[datum.p50, datum.p75, datum.p90]`,
              as: 'end',
            },
            {
              flatten: ['range', 'start', 'end'],
            },
          ],
          mark: {
            type: 'area',
            opacity: 0.5,
            tooltip: {
              content: 'data',
            },
          },
          encoding: {
            color: {
              field: 'range',
              type: 'nominal',
              scale: {
                scheme: 'blues',
              },
              legend: {
                labelExpr: `{'p25-p50': '25% - 50%', 'p50-p75': '50% - 75%', 'p75-p90': '75% - 90%'}[datum.label]`,
              },
            },
            y: {
              field: 'end',
              type: 'quantitative',
              scale: {
                zero: true,
              },
              axis: {
                title: 'Lag',
              },
            },
            y2: { field: 'start' },
          },
        },
        {
          mark: {
            type: 'line',
            tooltip: {
              content: 'data',
            },
          },
          encoding: {
            y: {
              field: 'p50',
              type: 'quantitative',
            },
          },
        },
      ],
      encoding: {
        x: {
          field: field,
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
            title: title,
          },
        },
      },
    };
    return spec;
  }

  function generateBoxPlotDayOfMonthLayer(field) {
    /**
     * @type {import('vega-lite/build/src/spec').NonNormalizedSpec}
     */
    const spec = {
      width: 1000,
      height: 200,
      transform: [
        {
          filter: 'datum.completed != null',
        },
      ],
      mark: {
        type: 'boxplot',
      },
      encoding: {
        row: {
          field: 'completed',
          type: 'nominal',
          title: {
            signal: `{'p25': '25%', 'p50': '50%', 'p75': '75%', 'p90': '90%'}[datum.label]`,
          },
          axis: {
            title: 'Confidence Reached',
          },
        },
        color: {
          field: 'completed',
          type: 'nominal',
          legend: {
            labelAngle: 0,
            labelExpr: `{'p25': '25%', 'p50': '50%', 'p75': '75%', 'p90': '90%'}[datum.label]`,
          },
        },
        x: {
          field: field,
          type: 'ordinal',
          timeUnit: 'date',
          axis: {
            title: 'Reference Day of Month',
            format: '%d',
            labelAngle: 0,
          },
          spacing: 10,
        },
        y: {
          // aggregate: 'max',
          field: 'lag',
          type: 'quantitative',
        },
      },
    };
    return spec;
  }

  function generateBoxPlotWeekdayLayer(field) {
    /**
     * @type {import('vega-lite/build/src/spec').NonNormalizedSpec}
     */
    const spec = {
      width: 220,
      height: 200,
      transform: [
        {
          filter: 'datum.completed != null',
        },
      ],
      mark: {
        type: 'boxplot',
      },
      encoding: {
        column: {
          field: 'completed',
          type: 'nominal',
          title: {
            signal: `{'p25': '25%', 'p50': '50%', 'p75': '75%', 'p90': '90%'}[datum.label]`,
          },
          axis: {
            title: 'Confidence Reached',
          },
        },
        color: {
          field: 'completed',
          type: 'nominal',
          legend: {
            labelAngle: 0,
            labelExpr: `{'p25': '25%', 'p50': '50%', 'p75': '75%', 'p90': '90%'}[datum.label]`,
          },
        },
        x: {
          field: field,
          type: 'ordinal',
          timeUnit: 'day',
          axis: {
            title: 'Reference Weekday',
            format: '%a',
            labelAngle: 0,
          },
          spacing: 10,
        },
        y: {
          // aggregate: 'max',
          field: 'lag',
          type: 'quantitative',
        },
      },
    };
    return spec;
  }

  function generateSpec(indicator, maxConfidence = 0.95) {
    const cont = (v) => `(datum.confidence >= 0.${v} && datum.prevConfidence < 0.${v}) ? 'p${v}'`;
    const confidenceClassifier = `${cont(90)} : (${cont(75)} : (${cont(50)} : (${cont(25)} : null)))`;

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
        subtitle: `clamped to <= ${maxConfidence} confidence`,
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
              field: 'confidence',
              param: 1,
              as: 'prevConfidence',
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
          calculate: 'datum.prevConfidence != null ? datum.prevConfidence : 0',
          as: 'prevConfidence',
        },
        {
          // keep all < 0.95 and remove all besides the first one over 0.95
          filter: `datum.confidence < ${maxConfidence} || datum.prevConfidence < ${maxConfidence}`,
        },
        {
          calculate: confidenceClassifier,
          as: 'completed',
        },
      ],
      // resolve: {
      //   axis: {
      //     x: 'shared',
      //     y: 'shared'
      //   }
      // },
      vconcat: [
        generateLayer('date_value', 'Reference Date', 0, maxConfidence),
        generateStreamLayer('date_value', 'Reference Date'),
        generateLayer('issue_date', 'Issue Date', 2, maxConfidence),
        generateBoxPlotDayOfMonthLayer('date_value'),
        generateBoxPlotWeekdayLayer('date_value'),
      ],
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

<style>
  .chart-300 > :global(.vega-embed) {
    height: 1200px;
  }
</style>
