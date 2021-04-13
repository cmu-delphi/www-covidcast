<script lang="ts">
  import type { TopLevelSpec } from 'vega-lite';
  import type { NormalizedSpec } from 'vega-lite/build/src/spec';
  import Vega from '../../components/Vega.svelte';
  import { IndicatorStatus, loadBackFillProfile } from '../../data/indicatorInfo';
  import { commonConfig } from '../../specs/commonSpec';
  import { DateParam } from '../../stores/params';
  import DownloadMenu from '../mobile/components/DownloadMenu.svelte';

  export let indicator: IndicatorStatus;
  export let date: Date;

  $: window = new DateParam(date).windowTimeFrame;

  $: data = loadBackFillProfile(indicator, window);

  function generateLayer(field: string, title: string, i: number): NormalizedSpec {
    return {
      width: 'container',
      height: 300,
      mark: {
        type: 'rect',
        stroke: null,
        width: {
          expr: `width / customCountDays(domain('concat_${i}_x')[0], domain('concat_${i}_x')[1])`,
        },
        height: {
          expr: `height / (domain('concat_${i}_y')[1] - domain('concat_${i}_y')[0])`,
        },
        tooltip: {
          content: 'data',
        },
      },
      encoding: {
        x: {
          field: field,
          type: 'temporal',
          axis: {
            format: '%m/%d',
            formatType: 'cachedTime',
            labelOverlap: true,
            grid: true,
            gridDash: [4, 4],
            tickCount: 'week',
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
        color: {
          field: 'confidence',
          type: 'quantitative',
          scale: {
            type: 'pow',
            exponent: 0.1,
            scheme: 'viridis',
          },
          legend: {
            gradientLength: 500,
          },
        },
      },
    };
  }
  function generateSpec(indicator: IndicatorStatus): TopLevelSpec {
    return {
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
        top: 50,
        right: 100,
        bottom: 50,
      },
      // resolve: {
      //   axis: {
      //     x: 'shared',
      //     y: 'shared'
      //   }
      // },
      vconcat: [generateLayer('date_value', 'Reference Date', 0), generateLayer('issue_date', 'Issue Date', 1)],
    };
  }

  $: spec = generateSpec(indicator);

  let vegaRef: Vega | undefined = undefined;
</script>

<div class="chart-300">
  <Vega bind:this={vegaRef} {spec} {data} className="charekt-breakout" />
  <DownloadMenu {vegaRef} absolutePos fileName="{indicator.name}_Backfill_profile" advanced={false} />
</div>

<style>
  .chart-300 > :global(.vega-embed) {
    height: 800px;
  }
</style>
