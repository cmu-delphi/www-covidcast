import {
  colorEncoding,
  CURRENT_DATE_HIGHLIGHT,
  stdErrLayer,
  stdErrTransform,
} from '../../components/DetailView/vegaSpec';
import { addMissing, fetchTimeSlice, formatAPITime } from '../../data';
import { levelMegaCounty } from '../../stores/constants';

function fetchMulti(sensor, selections, startDay, endDay) {
  return Promise.all(
    selections.map((s) => {
      const region = s.info;
      if (region.level === levelMegaCounty.id) {
        return [];
      }
      return fetchTimeSlice(sensor, region.level, region.propertyId, startDay, endDay, false, {
        geo_value: region.propertyId,
      })
        .then((rows) => addMissing(rows, sensor))
        .then((rows) =>
          rows.map((row) => {
            row.displayName = region.displayName;
            return row;
          }),
        );
    }),
  ).then((rows) => rows.flat());
}

function fetchSingle(sensor, region, startDay, endDay) {
  if (!region || region.level === levelMegaCounty.id) {
    return Promise.resolve([]);
  }
  return fetchTimeSlice(sensor, region.level, region.propertyId, startDay, endDay, false, {
    geo_value: region.propertyId,
  })
    .then((rows) => addMissing(rows, sensor))
    .then((rows) =>
      rows.map((row) => {
        row.displayName = region.displayName;
        return row;
      }),
    );
}

/**
 * @param {import('../../data').SensorEntry} sensor
 * @param {import('../../stores').CompareSelection[]} selections
 * @param {Date} startDay
 * @param {Date} endDay
 */
export function prepareSensorData(sensor, selections, startDay, endDay) {
  const single = selections.length < 2;
  const singleRegion = selections.length === 0 ? null : selections[0].info;

  return {
    sensor,
    data: single
      ? fetchSingle(sensor, singleRegion, startDay, endDay)
      : fetchMulti(sensor, selections, startDay, endDay),
    spec: createSpec(sensor, selections, [startDay, endDay]),
    noDataText: singleRegion
      ? singleRegion.level === levelMegaCounty.id
        ? `Please select a county`
        : 'No data available'
      : 'No location selected',
  };
}

export function resolveHighlightedTimeValue(e) {
  const highlighted = e.detail.value;
  if (highlighted && Array.isArray(highlighted.date_value) && highlighted.date_value.length > 0) {
    return Number.parseInt(formatAPITime(highlighted.date_value[0]), 10);
  }
  return null;
}

export function resolveClickedTimeValue(e) {
  const item = e.detail.item;
  if (item && item.isVoronoi) {
    return item.datum.datum.time_value;
  }
  return null;
}

const stdErrTransformPercent = [
  {
    calculate: 'datum.value == null ? null : (datum.value - datum.stderr) / 100',
    as: 'value_lower_bound',
  },
  {
    calculate: 'datum.value == null ? null : (datum.value + datum.stderr) / 100',
    as: 'value_upper_bound',
  },
];

/**
 * @param {import('../../data').SensorEntry} sensor
 * @param {{info: import('../../maps').NameInfo, color: string}[]} selections
 * @param {?[Date, Date]} dateRange
 * @param {?{field?: string, domain?: [number, number]}} valuePatch
 */
export function createSpec(sensor, selections, dateRange, valuePatch) {
  const isPercentage = sensor.format === 'percent';
  const scalePercent = isPercentage ? (v) => v / 100 : (v) => v;

  const clipping = valuePatch && valuePatch.domain ? true : false;
  const yMax = clipping ? valuePatch.domain[1] : 0;
  const yMaxScaled = scalePercent(yMax);

  const yField = valuePatch && valuePatch.field ? valuePatch.field : isPercentage ? 'pValue' : 'value';
  // console.info('yMax', yMax, 'clipping', clipping, 'yField', yField);

  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
    data: { name: 'values' },
    padding: { left: 50, top: 9, bottom: 16, right: 2 },
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    transform: [
      ...(sensor.hasStdErr ? (isPercentage ? stdErrTransformPercent : stdErrTransform) : []),
      {
        calculate: 'datum.value == null ? null : datum.value / 100',
        as: 'pValue',
      },
      {
        calculate: !clipping + '|| datum.' + yField + ' == null ? false : datum.' + yField + ' > ' + yMaxScaled,
        as: 'clipped',
      },
      {
        calculate: 'datum.clipped == null ? false : !datum.clipped',
        as: 'notClipped',
      },
      {
        calculate: 'datum.clipped ? datum.' + yField + ' : null',
        as: 'clippedData',
      },
      {
        window: [
          {
            op: 'lag',
            field: 'notClipped',
            as: 'maybeStartClipping',
          },
          {
            op: 'lead',
            field: 'notClipped',
            as: 'maybeEndClipping',
          },
        ],
      },

      {
        calculate: '(datum.clipped && datum.maybeStartClipping) ? datum.' + yField + ' : null',
        as: 'startClippedData',
      },
      { calculate: '(datum.clipped && datum.mayeEndClipping) ? datum.' + yField + ' : null', as: 'endClippedData' },
    ],
    resolve: {
      scale: { y: 'shared' },
    },
    encoding: {
      color: colorEncoding(selections),
      x: {
        field: 'date_value',
        type: 'temporal',
        axis: {
          title: null,
          format: '%m/%d',
          formatType: 'cachedTime',
          tickCount: 'month',
        },
        scale: dateRange
          ? {
              domain: [dateRange[0].getTime(), dateRange[1].getTime()],
            }
          : {},
      },
    },
    layer: [
      // complicated construct to have proper typings
      ...(sensor.hasStdErr ? [stdErrLayer] : []),
      {
        mark: {
          type: 'line',
          interpolate: 'linear',
          clip: true,
        },
        encoding: {
          y: {
            field: yField,
            type: 'quantitative',
            scale: {
              domainMin: clipping ? scalePercent(valuePatch.domain[0]) : 0,
              domainMax: clipping ? scalePercent(valuePatch.domain[1]) : undefined,
              clamp: true,
            },
            axis: {
              ...(isPercentage ? { format: '.1%', formatType: 'cachedNumber' } : {}),
              title: null,
              tickCount: 3,
              minExtent: 25,
            },
          },
        },
      },
      // Draw clipped data differently.
      {
        mark: {
          type: 'line',
          interpolate: 'linear',
          stroke: 'red',
          strokeWidth: 6,
          strokeOpacity: 0.25,
          yOffset: -3,
        },
        encoding: {
          y: {
            field: 'clippedData',
            type: 'quantitative',
          },
        },
      },
      {
        mark: {
          type: 'text',
          text: '\u21BF',
          size: 11,
          baseline: 'bottom',
          dy: 2,
          stroke: 'red',
        },
        encoding: {
          y: {
            field: 'startClippedData',
            type: 'quantitative',
          },
        },
      },
      {
        mark: {
          type: 'text',
          text: '\u21C2',
          size: 11,
          baseline: 'bottom',
          dy: 2,
          stroke: 'red',
        },
        encoding: {
          y: {
            field: 'endClippedData',
            type: 'quantitative',
          },
        },
      },
      {
        selection: {
          highlight: {
            type: 'single',
            empty: 'none',
            on: 'mouseover',
            nearest: true,
            encodings: ['x'],
            clear: 'mouseout',
          },
        },
        // use vertical rule for selection, since nearest point is a real performance bummer
        mark: {
          type: 'rule',
          strokeWidth: 2.5,
          color: 'white',
          opacity: 0.001,
          tooltip: true,
        },
      },
      {
        mark: {
          type: 'point',
          radius: 1,
          stroke: null,
          fill: 'grey',
        },
        encoding: {
          opacity: {
            condition: [
              {
                selection: 'highlight',
                value: 1,
              },
              {
                test: 'datum.time_value == highlightTimeValue',
                value: 1,
              },
            ],
            value: 0,
          },
          y: {
            field: yField,
            type: 'quantitative',
          },
        },
      },
      {
        mark: {
          type: 'rule',
        },
        encoding: {
          opacity: {
            condition: [
              {
                selection: 'highlight',
                value: 1,
              },
              {
                test: 'datum.time_value == highlightTimeValue',
                value: 1,
              },
            ],
            value: 0,
          },
          y: {
            field: yField,
            type: 'quantitative',
          },
        },
      },
      CURRENT_DATE_HIGHLIGHT,
    ],
    config: {
      customFormatTypes: true,
      legend: {
        disable: true,
      },
    },
  };

  return spec;
}
