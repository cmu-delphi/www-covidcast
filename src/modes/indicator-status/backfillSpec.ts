import type { TopLevelSpec } from 'vega-lite';
import type { IndicatorStatus, ProfileEntry } from '../../data/indicatorInfo';
import { BASE_SPEC } from '../../specs/commonSpec';

export function generateHeatMapSpec(
  indicator: IndicatorStatus,
  {
    valueField = 'value_completeness',
    valueLabel = 'Completeness',
    dateField = 'issue_date',
    dateLabel = 'Issue Date',
    title = `${indicator.name} Backfill Issue Profile`,
  }: {
    valueField?: keyof Pick<
      ProfileEntry,
      'sample_size_completeness' | 'sample_size_rel_change' | 'value_completeness' | 'value_rel_change'
    >;
    valueLabel?: string;
    dateField?: keyof Pick<ProfileEntry, 'issue_date' | 'date_value'>;
    dateLabel?: string;
    title?: string;
  },
): TopLevelSpec {
  const spec: TopLevelSpec = {
    ...BASE_SPEC,
    title: {
      text: title,
    },
    padding: {
      left: 50,
      top: 30,
      right: 100,
      bottom: 40,
    },
    layer: [
      {
        mark: {
          type: 'rect',
          stroke: null,
          strokeWidth: 0,
          strokeOpacity: 0,
          width: {
            expr: `width / customCountDays(domain('x')[0], domain('x')[1])`,
          },
          height: {
            expr: `height / (domain('y')[1] - domain('y')[0])`,
          },
          tooltip: {
            content: 'data',
          },
          // opacity: 0.5,
        },
        encoding: {
          color: {
            field: valueField,
            type: 'quantitative',
            scale: valueField.endsWith('rel_change')
              ? {
                  domainMid: 0,
                  nice: false,
                  // scheme: valueField.endsWith('rel_change') ?  'viridis',
                }
              : {
                  domain: [0, 1],
                  clamp: true,
                  nice: false,
                },
            legend: {
              title: valueLabel,
              titleAlign: 'left',
              titleOrient: 'left',
              // gradientLength: 00,
            },
          },
        },
      },
      {
        transform: [
          {
            filter: `datum.is_anchor`,
          },
        ],
        mark: {
          type: 'line',
        },
        encoding: {
          color: {
            field: 'is_anchor',
            type: 'ordinal',
            scale: {
              range: ['blue'],
            },
            legend: {
              title: null,
              labelExpr: `'anchor'`,
            },
          },
        },
      },
    ],
    encoding: {
      x: {
        field: dateField,
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
          title: dateLabel,
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

// export function generateIssueDateSpec(indicator: IndicatorStatus): TopLevelSpec {
//   const spec = generateHeatMapSpec(indicator, {});
//   return spec;
// }

// export function generateIssueDateDeltaSpec(indicator: IndicatorStatus): TopLevelSpec {
//   const spec = generateHeatMapSpec(indicator, {
//     valueField: 'value_rel_change',
//     valueLabel: 'Relative Change',
//     title: `${indicator.name} Backfill Relative Change Profile`,
//   });
//   return spec;
// }

export function injectClassification(spec: TopLevelSpec): void {
  const cont = (v: number) => `(datum.value_completeness >= 0.${v} && datum.prevCompleteness < 0.${v}) ? 'p${v}'`;
  const completenessClassifier = `${cont(90)} : (${cont(75)} : (${cont(50)} : (${cont(25)} : null)))`;

  spec.transform = [
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
  ];
}

// export function generateReportedDateSpec(indicator: IndicatorStatus): TopLevelSpec {
//   const spec = generateHeatMapSpec(indicator, {
//     xField: 'date_value',
//     xLabel: 'Reported Date',
//     title: `${indicator.name} Backfill Profile`,
//   });
//   // spec.layer.push({
//   //   transform: [
//   //     {
//   //       filter: `datum.completed == 'p90'`,
//   //     },
//   //   ],
//   //   mark: {
//   //     type: 'line',
//   //     stroke: 'red',
//   //   },
//   // });
//   return spec;
// }

// export function generateReportedDateDeltaSpec(indicator: IndicatorStatus): TopLevelSpec {
//   const spec = generateHeatMapSpec(indicator, {
//     valueField: 'value_rel_change',
//     valueLabel: 'Relative Change',
//     xField: 'date_value',
//     xLabel: 'Reported Date',
//     title: `${indicator.name} Backfill Relative Change Profile`,
//   });
//   return spec;
// }
