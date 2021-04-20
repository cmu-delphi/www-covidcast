import { stateInfo } from '../maps';
import { ZERO_COLOR } from '../theme';
import { EPIDATA_CASES_OR_DEATH_VALUES } from '../stores/constants';
import type { RegionInfo } from '../maps';
import type { TopLevelSpec } from 'vega-lite';
import { BASE_SPEC } from './commonSpec';

export const state2TileCell: { id: string; x: number; y: number }[] = [
  { id: 'AK', x: 0, y: 0 },
  { id: 'ME', x: 11, y: 0 },
  { id: 'VT', x: 9, y: 1 },
  { id: 'NH', x: 10, y: 1 },
  { id: 'WA', x: 1, y: 2 },
  { id: 'MT', x: 2, y: 2 },
  { id: 'ND', x: 3, y: 2 },
  { id: 'MN', x: 4, y: 2 },
  { id: 'WI', x: 5, y: 2 },
  { id: 'MI', x: 7, y: 2 },
  { id: 'NY', x: 9, y: 2 },
  { id: 'MA', x: 10, y: 2 },
  { id: 'RI', x: 11, y: 2 },
  { id: 'ID', x: 1, y: 3 },
  { id: 'WY', x: 2, y: 3 },
  { id: 'SD', x: 3, y: 3 },
  { id: 'IA', x: 4, y: 3 },
  { id: 'IL', x: 5, y: 3 },
  { id: 'IN', x: 6, y: 3 },
  { id: 'OH', x: 7, y: 3 },
  { id: 'PA', x: 8, y: 3 },
  { id: 'NJ', x: 9, y: 3 },
  { id: 'CT', x: 10, y: 3 },
  { id: 'OR', x: 1, y: 4 },
  { id: 'NV', x: 2, y: 4 },
  { id: 'CO', x: 3, y: 4 },
  { id: 'NE', x: 4, y: 4 },
  { id: 'MO', x: 5, y: 4 },
  { id: 'KY', x: 6, y: 4 },
  { id: 'WV', x: 7, y: 4 },
  { id: 'VA', x: 8, y: 4 },
  { id: 'MD', x: 9, y: 4 },
  { id: 'DE', x: 10, y: 4 },
  { id: 'CA', x: 1, y: 5 },
  { id: 'UT', x: 2, y: 5 },
  { id: 'NM', x: 3, y: 5 },
  { id: 'KS', x: 4, y: 5 },
  { id: 'AR', x: 5, y: 5 },
  { id: 'TN', x: 6, y: 5 },
  { id: 'NC', x: 7, y: 5 },
  { id: 'SC', x: 8, y: 5 },
  { id: 'DC', x: 9, y: 5 },
  { id: 'AZ', x: 3, y: 6 },
  { id: 'OK', x: 4, y: 6 },
  { id: 'LA', x: 5, y: 6 },
  { id: 'MS', x: 6, y: 6 },
  { id: 'AL', x: 7, y: 6 },
  { id: 'GA', x: 8, y: 6 },
  { id: 'HI', x: 0, y: 7 },
  { id: 'TX', x: 4, y: 7 },
  { id: 'FL', x: 7, y: 7 },
  { id: 'PR', x: 10, y: 7 },
];

const EPIDATA_ROW_KEYS = ['geo_value', 'value', 'date_value', 'time_value', 'stderr', 'sample_size'].concat(
  EPIDATA_CASES_OR_DEATH_VALUES,
);
const NAME_INFO_KEYS = ['propertyId', 'displayName', 'population', 'state'];

export interface MatrixOptions {
  width?: number;
  height?: number;
  legendTitle?: string;
  domain?: [number, number];
  scheme?: string;
}

function genBaseSpec(
  infos: readonly RegionInfo[],
  assignments: { id: string; x: number; y: number; value?: number }[],
  { width = 500, height = 300, scheme = 'yellowgreenblue', domain = undefined, legendTitle }: MatrixOptions = {},
) {
  const spec: TopLevelSpec = {
    ...BASE_SPEC,
    width,
    height,
    padding: {
      expr: `paddingSquareCenter(containerSize(), domain('x'), domain('y'), {left: 10, bottom: 10, top: 10, right: 100}, 0.5, 0, 1, 0.8)`,
    },
    datasets: {
      values: [],
    },
    data: {
      values: assignments,
    },
    transform: [
      {
        lookup: 'id',
        from: {
          data: { values: infos },
          key: 'propertyId',
          fields: NAME_INFO_KEYS,
        },
      },
      {
        calculate: 'lower(datum.propertyId)',
        as: 'propertyId_l',
      },
      {
        lookup: 'propertyId_l',
        from: {
          data: { name: 'values' },
          key: 'geo_value',
          fields: EPIDATA_ROW_KEYS,
        },
      },
    ],
    encoding: {
      x: {
        field: 'x',
        type: 'ordinal',
        scale: {
          type: 'band',
          paddingInner: 0,
          paddingOuter: 0.5,
        },
        axis: null,
      },
      y: {
        field: 'y',
        type: 'ordinal',
        scale: {
          type: 'band',
          paddingInner: 0,
          paddingOuter: 0,
        },
        axis: null,
      },
    },
    layer: [
      {
        mark: {
          type: 'point',
          shape: 'square',
          stroke: '#666',
          size: {
            expr: `pow(bandwidth('x'), 2)`,
          },
        },
        encoding: {
          shape: {
            condition: {
              test: 'datum.y % 2 == 1',
              value: "'M0,-0.6 L1,-1 L2,-0.6 L2,0.6 L1,1 L0,0.6 Z'",
            },
            value: "'M-1,-0.6 L0,-1 L1,-0.6 L1,0.6 L0,1 L-1,0.6 Z'",
          },
          fill: {
            condition: {
              test: 'datum.value === 0',
              value: ZERO_COLOR,
            },
            field: 'value',
            type: 'quantitative',
            scale: {
              domain,
              // domainMin: 0,
              // domainMax: 149,
              scheme,
              clamp: true,
            },
            legend: {
              orient: 'right',
              titleAlign: 'center',
              // : 'normal',
              labelLimit: 30,
              tickMinStep: 0.1,
              titleOrient: 'left',
              title: legendTitle,
              titleFontWeight: 'normal',
            },
          },
        },
      },
      {
        mark: {
          type: 'text',
          dx: {
            expr: `datum.y % 2 == 1 ? bandwidth('x') / 2 : 0`,
          },
        },
        encoding: {
          text: {
            field: 'propertyId',
            type: 'ordinal',
          },
        },
      },
    ],
  };
  return spec;
}

export function generateMatrixStateSpec(options: MatrixOptions = {}): TopLevelSpec {
  return genBaseSpec(stateInfo, state2TileCell, options);
}
