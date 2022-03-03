import type { ExprRef, Signal, SignalRef, Update } from 'vega';
import type { Axis } from 'vega-lite/build/src/axis';
import type { Field, PositionFieldDef, PositionValueDef } from 'vega-lite/build/src/channeldef';
import type { LayerSpec, NormalizedLayerSpec, NormalizedUnitSpec, TopLevelSpec } from 'vega-lite/build/src/spec';
import { CURRENT_DATE_HIGHLIGHT } from '../components/vega/vegaSpecUtils';
import type { Annotation } from '../data';
import type { RegionInfo } from '../data/regions';
import { toTimeValue } from '../data/utils';
import { BASE_SPEC, commonConfig, CREDIT } from './commonSpec';

// dark2
// has to be the rgb notation to create a pure version out of it for CSS variables manipulation
export const MULTI_COLORS = [
  'rgb(27, 158, 119)',
  'rgb(217, 95, 2)',
  'rgb(117, 112, 179)',
  'rgb(231, 41, 138)',
  'rgb(102, 166, 30)',
  'rgb(230, 171, 2)',
  'rgb(166, 118, 29)',
];

export const COLOR = '#666666';

export function patchHighlightTuple(current: Signal): Signal {
  // patches the highlight signal,
  // see current.on[0].update
  const updateCode = (current.on![0] as { update: Update }).update as string;
  (current.on![0] as { update: Update }).update = `patchPickedItem(event) && item().${updateCode.replace(
    / datum/,
    ' item().datum',
  )}`;
  return current;
}

export function resetOnClearHighlighTuple(date: Date): (current: Signal) => Signal {
  return (current: Signal): Signal => {
    patchHighlightTuple(current);
    const updateCode = (current.on![0] as { update: Update }).update as string;
    const match = /(unit:.*values: )\[/.exec(updateCode);
    const prefix = match ? match[0] : 'unit: "layer_1", fields: highlight_tuple_fields, values: [';
    (current.on![1] as { update: Update }).update = `{${prefix}${date.getTime()}]}`;
    return current;
  };
}

export function resolveHighlightedField<T = number>(e: CustomEvent, field: string): T | null {
  const highlighted = (e.detail as { value: null | { [key: string]: T[] } }).value;
  if (highlighted && Array.isArray(highlighted[field]) && highlighted[field].length > 0) {
    return highlighted[field][0];
  }
  return null;
}

export function resolveHighlightedDate(e: CustomEvent, field = 'date_value'): Date | null {
  const value = resolveHighlightedField<string | number>(e, field);
  return value != null ? new Date(value) : null;
}

export const signalPatches = {
  highlight_tuple: patchHighlightTuple,
};

// function smartPadding(valueField = 'value') {
//   return {
//     // in case the values are close to 0 .. no padding otherwise some padding
//     // if range.min < 10 && range.range > 30 ? 0 : 20
//     expr: `customObjChecks(customExtent(data("values"), "${valueField}"), ['min', '<', 10], ['range', '>', 30]) ? 0 : 20`,
//   };
// }

export function autoAlign(dateField = 'date_value', offset = 40): ExprRef {
  return {
    // auto align based on remaining space
    expr: `(width - scale('x', datum.${dateField})) < ${offset} ? 'right' : (scale('x', datum.${dateField})) > ${offset} ? 'center' : 'left'`,
  };
}

export function genCreditsLayer({ shift = 55 } = {}): NormalizedUnitSpec {
  return {
    data: {
      values: [
        {
          text: '',
        },
      ],
    },
    mark: {
      type: 'text',
      align: 'right',
      baseline: 'bottom',
      x: {
        expr: 'width',
      },
      y: {
        expr: `height + ${shift}`,
      },
      text: CREDIT,
    },
  };
}

export function genDateHighlight(date: Date, color = 'lightgrey'): NormalizedUnitSpec {
  return {
    data: {
      values: [
        {
          date_value: date.getTime(),
        },
      ],
    },
    mark: {
      type: 'rule',
      tooltip: false,
    },
    encoding: {
      color: {
        value: color,
      },
      x: {
        field: 'date_value',
        type: 'temporal',
      },
    },
  };
}

export function genAnnotationLayer(
  annotations: Annotation[],
  dataDomain: { min: Date; max: Date },
): NormalizedLayerSpec {
  return {
    data: {
      values: annotations.map((a, i) => ({
        index: i,
        uncertainty: a.uncertainty,
        start: a.dates[0] < dataDomain.min ? dataDomain.min : a.dates[0],
        end: a.dates[1] > dataDomain.max ? dataDomain.max : a.dates[1],
      })),
    },
    layer: [
      {
        mark: {
          type: 'rect',
          tooltip: false,
          opacity: 0.1,
        },
        encoding: {
          x: {
            field: 'start',
            type: 'temporal',
          },
          x2: {
            field: 'end',
            type: 'temporal',
          },
          color: {
            condition: {
              test: 'datum.uncertainty',
              value: '#767676',
            },
            value: '#D46B08',
          },
        },
      },
      {
        mark: {
          type: 'text',
          text:
            annotations.length > 1
              ? {
                  expr: `(datum.uncertainty ? 'ℹ️' : '⚠') + ' (' + (datum.index + 1) + ')'`,
                }
              : {
                  expr: `datum.uncertainty ? 'ℹ️' : '⚠'`,
                },
          baseline: 'top',
          align: 'left',
          dx: 2,
          dy: 2,
        },
        encoding: {
          x: {
            field: 'start',
            type: 'temporal',
          },
          y: {
            value: 0,
          },
          color: {
            condition: {
              test: 'datum.uncertainty',
              value: '#767676',
            },
            value: '#D46B08',
          },
        },
      },
    ],
  };
}

export function genUncertaintyLayer(
  annotation: Annotation,
  {
    dateField = 'date_value',
    valueField = 'value',
    compareField = 'displayName',
    multipleRegions,
  }: {
    dateField?: string;
    valueField?: string;
    compareField?: string;
    multipleRegions?: boolean;
  },
): NormalizedUnitSpec {
  const start = toTimeValue(annotation.dates[0]);
  const end = toTimeValue(annotation.dates[1]);

  return {
    transform: [
      {
        filter: `datum.time_value >= ${start} && datum.time_value <= ${end}`,
      },
    ],
    mark: {
      type: 'line',
      color: 'white',
      point: false,
      strokeDash: [2, 2],
    },
    encoding: {
      x: {
        field: dateField,
        type: 'temporal',
      },
      y: {
        field: valueField,
        type: 'quantitative',
      },
      detail: multipleRegions
        ? {
            field: compareField,
            type: 'nominal',
          }
        : undefined,
    },
  };
}

function genEmptyHighlightLayer(): NormalizedLayerSpec | NormalizedUnitSpec {
  return {
    data: {
      values: [
        {
          text: '',
        },
      ],
    },
    mark: {
      type: 'text',
      baseline: 'bottom',
      fontSize: 16,
      dy: -3,
      y: 0,
      x: 0,
      text: '',
    },
  };
}

export interface LineSpecOptions {
  width?: number;
  height?: number;
  xTitle?: string;
  domain?: [number, number];
  title?: string | string[];
  subTitle?: string;
  color?: string;
  initialDate?: Date | null;
  dateField?: string;
  valueField?: string;
  valueFormat?: string;
  valueDomain?: [number, number];
  zero?: boolean;
  highlightRegion?: boolean | string;
  reactOnMouseMove?: boolean;
  clearHighlight?: boolean;
  paddingLeft?: number;
  paddingTop?: number;
  infoLabelExpr?: string;
  autoAlignOffset?: number;
  tickCount?: Axis<ExprRef | SignalRef>['tickCount'];
  isWeeklySignal?: boolean;
  stderr?: boolean;
}

export function generateLineChartSpec({
  width = 800,
  height = 300,
  xTitle,
  domain,
  title,
  subTitle,
  color = COLOR,
  initialDate = null,
  dateField = 'date_value',
  valueField = 'value',
  valueFormat,
  valueDomain,
  zero = false,
  highlightRegion = false,
  reactOnMouseMove = true,
  clearHighlight = true,
  paddingLeft = 42,
  paddingTop,
  infoLabelExpr,
  autoAlignOffset = 40,
  tickCount = {
    interval: 'week' as const,
    step: 1,
  },
  isWeeklySignal = false,
  stderr = false,
}: LineSpecOptions = {}): TopLevelSpec & LayerSpec<Field> {
  // logic to automatically add the year for week 1 and first date
  const labelDateYear = `datum.label + (week(datum.value) === 1 ${
    domain ? `|| abs(week(datum.value) - week(toDate(${domain[0]}))) <= 1` : ''
  } ? '/' + year(datum.value) : '')`;
  let topOffset = 20;
  if (title) {
    topOffset += 22 * (Array.isArray(title) ? title.length : 1);
  }
  if (subTitle) {
    topOffset += 10;
  }
  const spec: TopLevelSpec & LayerSpec<Field> = {
    ...BASE_SPEC,
    width,
    height,
    padding: { left: paddingLeft, top: paddingTop ?? topOffset, bottom: 55, right: 15 },
    title: title
      ? {
          text: title,
          subtitle: subTitle,
          align: 'left',
          anchor: 'start',
        }
      : undefined,
    layer: [
      {
        mark: {
          type: 'line',
          color,
          point: false,
        },
        encoding: {
          x: {
            field: dateField,
            type: 'temporal',
            axis: {
              title: xTitle,
              format: '%m/%d',
              formatType: isWeeklySignal ? 'epiweekFormatSmart' : 'cachedTime',
              labelExpr: isWeeklySignal ? undefined : labelDateYear,
              labelOverlap: true,
              grid: true,
              gridDash: [4, 4],
              tickCount,
            },
            scale: {
              domain,
            },
          },
          y: {
            field: valueField,
            type: 'quantitative',
            axis: {
              grid: true,
              title: null,
              domain: false,
              tickCount: 5,
              labelFontSize: 14,
              format: valueFormat,
              // formatType: 'cachedNumber',
            },
            scale: {
              round: true,
              zero,
              domain: valueDomain,
              // padding: zero ? undefined : smartPadding(valueField),
            },
          },
          ...(highlightRegion
            ? {
                opacity: {
                  condition: {
                    test: `highlightRegion != null && highlightRegion != datum.${
                      typeof highlightRegion === 'string' ? highlightRegion : 'id'
                    }`,
                    value: 0.1,
                  },
                  value: 1,
                },
              }
            : {}),
        },
      },
      {
        params: [
          {
            name: 'highlight',
            select: {
              type: 'point',
              on: `click${reactOnMouseMove ? ', mousemove' : ''}, [touchstart, touchend] > touchmove`,
              nearest: true,
              clear: clearHighlight ? 'view:mouseout' : false,
              encodings: ['x'],
            },
            value: initialDate
              ? {
                  x: initialDate,
                }
              : undefined,
          },
        ],
        mark: {
          type: 'point',
          color,
          stroke: null,
          tooltip: false,
        },
        encoding: {
          x: {
            field: dateField,
            type: 'temporal',
          },
          y: {
            field: valueField,
            type: 'quantitative',
          },
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
      genCreditsLayer(),
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
            field: dateField,
            type: 'temporal',
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
              align: autoAlign(dateField, autoAlignOffset),
              color: COLOR,
              baseline: 'bottom',
              fontSize: 16,
              dy: -3,
            },
            encoding: {
              text: infoLabelExpr
                ? {
                    value: {
                      expr: infoLabelExpr,
                    },
                  }
                : {
                    field: dateField,
                    type: 'temporal',
                    format: '%a %b %d',
                    formatType: isWeeklySignal ? 'epiweekFormat' : 'cachedTime',
                  },
              y: {
                value: 0,
              },
            },
          },
        ],
      },
      genEmptyHighlightLayer(),
    ],
  };

  if (stderr) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const encoding: any = {
      ...spec.layer[0].encoding!,
      y: {
        field: 'stderr_min',
        type: 'quantitative',
      },
      y2: {
        field: 'stderr_max',
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (encoding.opacity) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      encoding.opacity = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        ...encoding.opacity,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        condition: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          ...encoding.opacity.condition,
          value: 0.02,
        },
        value: 0.25,
      };
    }
    spec.layer.unshift({
      transform: [
        {
          calculate: `datum.stderr != null && datum.${valueField} != null ? datum.${valueField} - datum.stderr : null`,
          as: 'stderr_min',
        },
        {
          calculate: `datum.stderr != null && datum.${valueField} != null ? datum.${valueField} + datum.stderr : null`,
          as: 'stderr_max',
        },
      ],
      mark: {
        type: 'area',
        color,
        opacity: 0.25,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any
      encoding: encoding as any,
    });
  }

  return spec;
}

export function generateCompareLineSpec(
  compare: string[],
  { compareField = 'displayName', ...options }: LineSpecOptions & { compareField?: string } = {},
): TopLevelSpec {
  const spec = generateLineChartSpec(options);
  spec.layer[0].encoding!.color = {
    field: compareField,
    type: 'nominal',
    scale: {
      domain: compare,
      range: MULTI_COLORS,
    },
    legend: null,
  };
  spec.layer[1].encoding!.color = {
    field: compareField,
    type: 'nominal',
  };
  return spec;
}

export function generateLineAndBarSpec(options: LineSpecOptions = {}): TopLevelSpec & LayerSpec<Field> {
  const spec = generateLineChartSpec({ ...options, stderr: false });
  const point = spec.layer[1] as NormalizedUnitSpec;
  point.mark = {
    type: 'rect',
    color: options.color || MULTI_COLORS[0],
    width: {
      expr: `floor(width / customCountDays(domain('x')[0], domain('x')[1]))`,
    },
    align: 'center',
  };
  (point.encoding!.y as PositionFieldDef<Field>).field = 'raw';
  (point.encoding!.y as PositionFieldDef<Field>).stack = null;
  (point.encoding!.opacity as PositionValueDef).value = 0.2;
  return spec;
}

export function createSignalDateLabelHighlight(topPosition = false): NormalizedLayerSpec {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const layer = Object.assign({}, CURRENT_DATE_HIGHLIGHT);
  delete layer.encoding;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  delete (layer as any).mark;
  return {
    ...layer,
    layer: [
      {
        mark: CURRENT_DATE_HIGHLIGHT.mark,
        encoding: CURRENT_DATE_HIGHLIGHT.encoding,
      },
      {
        mark: {
          type: 'text',
          baseline: topPosition ? 'bottom' : 'top',
          align: 'right',
          dy: topPosition ? -5 : 5,
          y: topPosition
            ? 0
            : {
                expr: 'height',
              },
        },
        encoding: {
          x: {
            field: 'date_value',
            type: 'temporal',
          },
          text: {
            field: 'date_value',
            type: 'temporal',
            format: '%-m/%-d',
            formatType: 'cachedTime',
          },
        },
      },
    ],
  };
}

export interface SparkLineOptions {
  dateField?: string;
  valueField?: string;
  domain?: [number, number];
  color?: string;
  highlightDate?: boolean | 'top';
  highlightStartEnd?: boolean;
  interactive?: boolean;
  height?: number;
  zero?: boolean;
  valueDomain?: [number, number];
}

export function generateSparkLine({
  dateField = 'date_value',
  valueField = 'value',
  domain,
  color = COLOR,
  highlightDate = false,
  highlightStartEnd = true,
  interactive = true,
  height = 30,
  zero = false,
  valueDomain,
}: SparkLineOptions = {}): TopLevelSpec {
  const spec: TopLevelSpec & LayerSpec<Field> = {
    ...BASE_SPEC,
    height,
    padding: {
      left: 2,
      top: highlightDate === 'top' ? 20 : 2,
      bottom: highlightDate && highlightDate !== 'top' ? 20 : 2,
      right: 2,
    },
    background: 'transparent',
    encoding: {
      x: {
        field: dateField,
        type: 'temporal',
        scale: {
          domain,
        },
        axis: {
          title: null,
          format: '%m/%d',
          formatType: 'cachedTime',
          grid: true,
          gridDash: [4, 4],
          labels: false,
          ticks: false,
          domain: false,
          tickCount: {
            interval: 'week',
            step: 1,
          },
        },
      },
    },
    layer: [
      ...(highlightDate
        ? [createSignalDateLabelHighlight(highlightDate === 'top')]
        : highlightDate === null
        ? []
        : [CURRENT_DATE_HIGHLIGHT]),
      {
        mark: {
          type: 'line' as const,
          color,
          point: false,
          interpolate: 'linear',
        },
        encoding: {
          y: {
            field: valueField,
            type: 'quantitative',
            scale: {
              zero,
              domain: valueDomain,
            },
            axis: null,
          },
        },
      },
      ...(interactive
        ? [
            {
              mark: {
                type: 'point' as const,
                fill: color,
                stroke: null,
                tooltip: true,
              },
              encoding: {
                y: {
                  field: valueField,
                  type: 'quantitative',
                },
                opacity: {
                  condition: {
                    param: 'highlight',
                    empty: false,
                    value: 1,
                  },
                  value: 0,
                },
              },
              params: [
                {
                  name: 'highlight',
                  select: {
                    type: 'point',
                    on: 'click, mousemove, [touchstart, touchend] > touchmove',
                    nearest: true,
                    clear: 'view:mouseout',
                    encodings: ['x'],
                  },
                },
              ],
            } as NormalizedUnitSpec,
          ]
        : []),
    ],
    config: {
      ...commonConfig,
      legend: {
        disable: true,
      },
    },
  };

  if (highlightStartEnd) {
    if (domain) {
      spec.layer.unshift({
        data: {
          values: [{ [dateField]: domain[0] }, { [dateField]: domain[1] }],
        },
        mark: {
          type: 'rule',
          tooltip: false,
          color,
        },
        encoding: {
          x: {
            field: dateField,
            type: 'temporal',
          },
        },
      });
    } else {
      spec.layer.unshift({
        transform: [
          {
            aggregate: [
              {
                op: 'min',
                field: dateField,
                as: 'date_value_min',
              },
              {
                op: 'max',
                field: dateField,
                as: 'date_value_max',
              },
            ],
          },
          {
            calculate: '[datum.date_value_min, datum.date_value_max]',
            as: dateField,
          },
          {
            flatten: [dateField],
          },
        ],
        mark: {
          type: 'rule',
          tooltip: false,
          color,
        },
        encoding: {
          x: {
            field: dateField,
            type: 'temporal',
          },
        },
      });
    }
  }
  return spec;
}

export function generateDistributionLineSpec(state: RegionInfo, options: LineSpecOptions = {}): TopLevelSpec {
  const spec = generateLineChartSpec(options);
  spec.transform = [
    {
      calculate: `datum.geo_value === '${state.propertyId.toLowerCase()}' ? datum.geo_value : 'us'`,
      as: 'group',
    },
    // {
    //   aggregate: [
    //     {
    //       op: 'median',
    //       as: 'value',
    //       field: 'value',
    //     },
    //     {
    //       op: 'q1',
    //       as: 'q1',
    //       field: 'value',
    //     },
    //     {
    //       op: 'q3',
    //       as: 'q3',
    //       field: 'value',
    //     },
    //     {
    //       op: 'values',
    //       as: 'values',
    //       field: 'value',
    //     },
    //   ],
    //   groupby: ['group', 'time_value', 'date_value'],
    // },
    {
      // cannot use aggregate since no support for 0.1 and 0.9 quantiles
      quantile: 'value',
      probs: [0.05, 0.25, 0.5, 0.75, 0.95],
      groupby: ['group', 'date_value', 'time_value'],
    },
    // fold again
    {
      aggregate: [
        {
          op: 'values',
          as: 'values',
        },
      ],
      groupby: ['group', 'date_value', 'time_value'],
    },
    {
      calculate: 'datum.values[2].value',
      as: 'value',
    },
  ];
  (spec.padding as unknown as { bottom: number }).bottom = 50;
  spec.layer[0].encoding!.color = {
    field: 'group',
    type: 'nominal',
    scale: {
      domain: [state.propertyId.toLowerCase(), 'us'],
      range: [MULTI_COLORS[0], COLOR],
    },
    legend: {
      direction: 'horizontal',
      orient: 'bottom',
      title: null,
      symbolType: 'stroke',
      labelExpr: `{'${state.propertyId.toLowerCase()}': '${state.displayName}', us: 'State Median'}[datum.value]`,
    },
  };
  // spec.layer[0].encoding.strokeWidth = {
  //   condition: {
  //     test: `datum['${compareField}'] === "${compare[0]}"`,
  //     value: 3,
  //   },
  //   value: 1,
  // };
  spec.layer[1].encoding!.color = {
    field: 'group',
    type: 'nominal',
  };
  spec.layer.unshift(
    {
      transform: [
        {
          filter: "datum.group == 'us'",
        },
        {
          calculate: '[datum.values[0].value, datum.values[1].value]',
          as: 'q_low',
        },
        {
          calculate: '[datum.values[4].value, datum.values[3].value]',
          as: 'q_high',
        },
        {
          calculate: `['5th-95th', '25th-75th']`,
          as: 'q_name',
        },
        {
          flatten: ['q_low', 'q_high', 'q_name'],
        },
      ],
      mark: {
        type: 'area',
      },
      encoding: {
        y: {
          field: 'q_low',
          type: 'quantitative',
        },
        y2: {
          field: 'q_high',
          type: 'quantitative',
        },
        fill: {
          field: 'q_name',
          type: 'ordinal',
          scale: {
            domain: ['5th-95th', '25th-75th'],
            range: ['#eeeeee', '#dddddd'],
          },
          legend: {
            direction: 'horizontal',
            orient: 'bottom',
            title: null,
            symbolType: 'square',
          },
        },
      },
    },
    {
      transform: [
        {
          filter: "datum.group == 'us'",
        },
      ],
      mark: {
        type: 'area',
        color: COLOR,
        opacity: 0.2,
      },
      encoding: {
        y: {
          field: 'q25',
          type: 'quantitative',
        },
        y2: {
          field: 'q75',
          type: 'quantitative',
        },
      },
    },
  );
  return spec;
}

export function generateDistributionLineSpec2(state: RegionInfo, options: LineSpecOptions = {}): TopLevelSpec {
  const spec = generateLineChartSpec(options);
  (spec.padding as unknown as { bottom: number }).bottom = 50;
  spec.layer[0].encoding!.color = {
    condition: {
      test: `datum.geo_value == '${state.propertyId.toLowerCase()}'`,
      value: MULTI_COLORS[0],
    },
    value: COLOR,
  };
  spec.layer[0].encoding!.detail = {
    field: 'geo_value',
  };
  spec.layer[0].encoding!.opacity = {
    condition: {
      test: `datum.geo_value == '${state.propertyId.toLowerCase()}'`,
      value: 1,
    },
    value: 0.1,
  };
  spec.layer[0].encoding!.strokeWidth = {
    condition: {
      test: `datum.geo_value == '${state.propertyId.toLowerCase()}'`,
      value: 3,
    },
    value: 2,
  };
  spec.layer[1].encoding!.color = {
    condition: {
      test: `datum.geo_value == '${state.propertyId.toLowerCase()}'`,
      value: MULTI_COLORS[0],
    },
    value: COLOR,
  };
  spec.layer[1].encoding!.detail = {
    field: 'geo_value',
  };
  return spec;
}
