import type { Gradient } from 'vega';
import type { Field } from 'vega-lite/build/src/channeldef';
import type { MarkDef } from 'vega-lite/build/src/mark';
import type { LayerSpec, NormalizedLayerSpec, NormalizedUnitSpec, TopLevelSpec } from 'vega-lite/build/src/spec';
import type { CountyInfo, RegionInfo, RegionLevel } from '../maps/interfaces';
import getRelatedCounties from '../maps/related';
import { EpiDataCasesOrDeathValues, EPIDATA_CASES_OR_DEATH_VALUES } from '../stores/constants';
import type { RegionEpiDataRow } from '../stores/params';
import { MAP_THEME, MISSING_COLOR, ZERO_COLOR } from '../theme';
import { BASE_SPEC, CREDIT } from './commonSpec';

const NAME_INFO_KEYS: (keyof CountyInfo)[] = ['propertyId', 'displayName', 'population', 'state', 'level'];
const EPIDATA_ROW_KEYS: (keyof (RegionEpiDataRow & CountyInfo & EpiDataCasesOrDeathValues))[] = [
  'geo_value',
  'value',
  'date_value',
  'time_value',
  'stderr',
  'sample_size',
  ...EPIDATA_CASES_OR_DEATH_VALUES,
  ...NAME_INFO_KEYS,
];

const missingStopCount = 70;
const missingGradient: Gradient = {
  // x1: 0,
  // y1: 0,
  // y2: 1,
  // x2: 2,
  gradient: 'linear',
  stops: Array(missingStopCount + 1)
    .fill(0)
    .map((_, i) => ({ offset: i / missingStopCount, color: i % 2 === 0 ? MISSING_COLOR : 'white' })),
};

function genCreditsLayer({ shift = 55 } = {}): NormalizedUnitSpec | NormalizedLayerSpec {
  return {
    data: {
      values: [
        {
          text: '',
        },
      ],
    },
    layer: [
      {
        mark: {
          type: 'rect',
          fontSize: 10,
          fill: 'white',
          align: 'left',
          baseline: 'top',
          x: -10,
          width: {
            expr: '20 + width',
          },
          y: {
            expr: `height + 10`,
          },
          height: 50,
        },
      },
      {
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
      },
    ],
  };
}

function genMissingLayer(missingLevel: RegionLevel = 'nation'): NormalizedUnitSpec {
  return {
    data: {
      name: missingLevel,
      format: {
        type: 'topojson',
        feature: missingLevel,
      },
    },
    mark: {
      type: 'geoshape',
      stroke: '#eaeaea',
      color: missingGradient,
    },
  };
}

function genMegaLayer(withStates: string | null = null): NormalizedUnitSpec {
  return {
    data: {
      name: 'state',
      format: {
        type: 'topojson',
        feature: 'state',
      },
    },
    transform: [
      {
        // if also dates are shown then mega just for the selected one
        calculate: withStates ? `lower(datum.id) == "${withStates}" ? datum.id + '000' : datum.id` : "datum.id + '000'",
        as: 'id',
      },
      {
        lookup: 'id',
        from: {
          data: { name: 'values' },
          key: 'id',
          fields: EPIDATA_ROW_KEYS,
        },
      },
    ],
    mark: {
      type: 'geoshape',
      stroke: null,
      tooltip: { content: 'data' },
    },
    encoding: {
      color: {
        condition: {
          test: 'datum.value === 0',
          value: ZERO_COLOR,
        },
        field: 'value',
        type: 'quantitative',
      },
    },
  };
}

function genStateBorderLayer({ strokeWidth = 1.1 } = {}): NormalizedUnitSpec {
  return {
    data: {
      name: 'state',
      format: {
        type: 'topojson',
        feature: 'state',
      },
    },
    mark: {
      type: 'geoshape',
      fill: null,
      stroke: MAP_THEME.stateOutline,
      strokeWidth,
      tooltip: false,
    },
    encoding: {
      key: {
        field: 'id',
      },
    },
  };
}

function genMegaHoverLayer(alsoOnCounties = false): NormalizedUnitSpec {
  return {
    data: {
      name: 'state',
      format: {
        type: 'topojson',
        feature: 'state',
      },
    },
    mark: {
      type: 'geoshape',
      fill: null,
      stroke: MAP_THEME.hoverRegionOutline,
      strokeWidth: 3,
      opacity: 0,
      tooltip: false,
    },
    encoding: {
      key: {
        field: 'id',
      },
      opacity: {
        // more performant
        condition: alsoOnCounties
          ? {
              test: {
                or: [
                  {
                    param: 'hover',
                    empty: false,
                  },
                  'hover && hover.geo_value && hover.geo_value[0] && slice(hover.geo_value[0], 0, 2) === slice(datum.id, 0, 2)',
                ],
              },
              value: 1,
            }
          : {
              param: 'hover',
              empty: false,
              value: 1,
            },
        value: 0,
      },
    },
  };
}

function genLevelLayer({
  strokeWidth = 1,
  scheme = 'yellowgreenblue',
  domain = undefined,
}: { strokeWidth?: number; scheme?: string; domain?: [number, number] } = {}): NormalizedUnitSpec {
  return {
    mark: {
      type: 'geoshape',
      stroke: '#eaeaea',
      strokeWidth,
      tooltip: { content: 'data' },
    },
    encoding: {
      key: {
        field: 'id',
      },
      color: {
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
          title: null,
          orient: 'none',
          direction: 'horizontal',
          fillColor: 'white',
          padding: 5,
          legendX: {
            expr: '(width / 2) - 10 - 140',
          },
          legendY: {
            expr: 'height + 12',
          },
          titleAnchor: 'end',
          labelLimit: 30,
          tickMinStep: 0.1,
          titleFontWeight: 'normal',
          gradientLength: 280,
          gradientThickness: 8,
        },
      },
    },
    params: [
      {
        name: 'hover',
        select: {
          type: 'point',
          on: 'mouseover, click',
          fields: ['geo_value'],
        },
      },
    ],
  };
}

function genLevelHoverLayer({ strokeWidth = 3 } = {}): NormalizedUnitSpec | NormalizedLayerSpec {
  return {
    mark: {
      type: 'geoshape',
      stroke: MAP_THEME.hoverRegionOutline,
      strokeWidth,
      opacity: 0,
      fill: null,
      tooltip: false,
    },
    encoding: {
      key: {
        field: 'id',
      },
      opacity: {
        // more performant
        condition: {
          param: 'hover',
          empty: false,
          value: 1,
        },
        value: 0,
      },
    },
  };
}

function genBaseSpec(
  level: RegionLevel,
  topoJSON: Promise<unknown>,
  { height = 300, title = undefined as string | string[] | undefined, subTitle = undefined as string | undefined },
): TopLevelSpec & LayerSpec<Field> {
  let topOffset = 10;
  if (title) {
    topOffset += 22 * (Array.isArray(title) ? title.length : 1);
  }
  if (subTitle) {
    topOffset += 10;
  }
  return {
    ...BASE_SPEC,
    height,
    title: title
      ? {
          text: title,
          subtitle: subTitle,
          align: 'left',
          anchor: 'start',
        }
      : undefined,
    padding: {
      left: 10,
      bottom: 55,
      top: topOffset,
      right: 10,
    },
    projection: {
      type: ('albersUsaTerritories' as unknown) as 'albersUsa', // hack since custom projection
    },
    datasets: {
      values: [],
      [level]: topoJSON,
    },
    data: {
      name: level,
      format: {
        type: 'topojson',
        feature: level,
      },
    },
    transform: [
      {
        lookup: 'id',
        from: {
          data: { name: 'values' },
          key: 'id',
          fields: EPIDATA_ROW_KEYS,
        },
      },
    ],
    layer: [],
  };
}

function countyJSON() {
  return import(/* webpackChunkName: 'shape-county' */ './shapefiles/county.json').then((r) => r.default);
}
function hrrJSON() {
  return import(/* webpackChunkName: 'shape-hrr' */ './shapefiles/hrr.json').then((r) => r.default);
}
function hhsJSON() {
  return import(/* webpackChunkName: 'shape-hhs' */ './shapefiles/hhs.json').then((r) => r.default);
}
function nationJSON() {
  return import(/* webpackChunkName: 'shape-nation' */ './shapefiles/nation.json').then((r) => r.default);
}
function stateJSON() {
  return import(/* webpackChunkName: 'shape-state' */ './shapefiles/state.json').then((r) => r.default);
}
function msaJSON() {
  return import(/* webpackChunkName: 'shape-msa' */ './shapefiles/msa.json').then((r) => r.default);
}
// function stateTilesJSON() {
//   return import(/* webpackChunkName: 'tile-state' */ './tilegrams/state.topo.json').then((r) => r.default);
// }
// function nationTilesJSON() {
//   return import(/* webpackChunkName: 'tile-nation' */ './tilegrams/nation.topo.json').then((r) => r.default);
// }

export type CommonParams = Parameters<typeof genBaseSpec>['2'] & Parameters<typeof genLevelLayer>['0'];

export function generateHRRSpec(options: CommonParams = {}): TopLevelSpec {
  const level = 'hrr';
  const topoJSON = hrrJSON();
  const spec = genBaseSpec(level, topoJSON, options);
  spec.datasets!.nation = nationJSON();
  spec.layer.push(genMissingLayer());

  spec.layer.push(genLevelLayer(options));
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

export function generateHHSSpec(options: CommonParams = {}): TopLevelSpec {
  const level = 'hhs';
  const topoJSON = hhsJSON();
  const spec = genBaseSpec(level, topoJSON, options);
  spec.datasets!.nation = nationJSON();
  spec.layer.push(genMissingLayer());

  spec.layer.push(genLevelLayer(options));
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

export function generateStateSpec(options: CommonParams = {}): TopLevelSpec {
  const level = 'state';
  const topoJSON = stateJSON();

  const spec = genBaseSpec(level, topoJSON, options);
  spec.datasets!.nation = nationJSON();
  spec.layer.push(genMissingLayer());

  // state, msa
  spec.layer.push(genLevelLayer(options));
  spec.layer.push(genLevelHoverLayer());
  spec.layer.push(genCreditsLayer());
  return spec;
}

export function generateMSASpec(options: CommonParams = {}): TopLevelSpec {
  const level = 'msa';
  const topoJSON = msaJSON();

  const spec = genBaseSpec(level, topoJSON, options);
  spec.datasets!.nation = nationJSON();
  spec.layer.push(genMissingLayer());

  // state, msa
  spec.layer.push(genLevelLayer(options));
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

export function generateNationSpec(options: CommonParams = {}): TopLevelSpec {
  const level = 'nation';
  const topoJSON = nationJSON();

  const spec = genBaseSpec(level, topoJSON, options);
  spec.transform!.unshift({
    calculate: JSON.stringify('us'),
    as: 'id',
  });

  spec.layer.push(genLevelLayer(options));
  spec.layer.push(genLevelHoverLayer());
  spec.layer.push(genCreditsLayer());
  return spec;
}

/**
 * generates a map of counties
 */
export function generateStateMapWithCountyDataSpec(options: CommonParams = {}): TopLevelSpec {
  const level = 'county';
  const topoJSON = countyJSON();

  const spec = genBaseSpec(level, topoJSON, options);

  spec.datasets!.nation = nationJSON();
  spec.layer.push(genMissingLayer());
  spec.datasets!.state = stateJSON();
  spec.layer.push(genMegaLayer());
  spec.layer.push(genLevelLayer({ ...options, strokeWidth: 0 }));
  spec.layer.push(genStateBorderLayer());
  spec.layer.push(genMegaHoverLayer(true));
  spec.layer.push(genLevelHoverLayer({ strokeWidth: 1 }));
  spec.layer.push(genCreditsLayer());
  return spec;
}

/**
 * generates a map of counties
 */
export function generateStateMapWithCountyBinaryDataSpec(options: CommonParams = {}): TopLevelSpec {
  const level = 'county';
  const topoJSON = countyJSON();

  const spec = genBaseSpec(level, topoJSON, options);

  spec.datasets!.nation = nationJSON();
  const missing = genMissingLayer();
  (missing.mark as MarkDef<'geoshape'>).color = MISSING_COLOR;
  spec.layer.push(missing);
  spec.datasets!.state = stateJSON();
  const counties = genLevelLayer({ ...options, strokeWidth: 0 });
  (missing.mark as MarkDef<'geoshape'>).tooltip = false;
  counties.encoding!.color = {
    condition: {
      test: 'datum.value != null',
      value: 'steelblue',
    },
    value: null,
  };
  spec.layer.push(counties);
  spec.layer.push(genStateBorderLayer());
  spec.layer.push(genLevelHoverLayer({ strokeWidth: 1 }));
  spec.layer.push(genCreditsLayer());
  return spec;
}

/**
 * generates a map of counties for a specific state
 */
export function generateCountiesOfStateSpec(
  state: RegionInfo,
  { withStates = false, ...options }: CommonParams & { withStates?: boolean } = {},
): TopLevelSpec {
  const level = 'county';
  const topoJSON = countyJSON();

  const spec = genBaseSpec(level, topoJSON, options);

  /**
   * @type {import('vega-lite/build/src/transform').Transform}
   */
  const isState = {
    filter: `lower(datum.id) == '${state.id}'`,
  };
  /**
   * @type {import('vega-lite/build/src/transform').Transform}
   */
  const isCountyOfState = {
    filter: `slice(lower(datum.id), 0, 2) == '${state.id}'`,
  };
  spec.transform!.unshift(isCountyOfState);

  spec.datasets!.nation = nationJSON();
  spec.layer.push(genMissingLayer());
  spec.datasets!.state = stateJSON();

  if (withStates) {
    spec.projection!.fit = {
      expr: `customInFilter(data('state'), 'id', ["${state.id}"])`,
    };
    spec.projection!.extent = {
      // fit to match 60% in the center
      expr: `[[width * 0.2, height * 0.2], [width* 0.8, height * 0.8]]`,
    };
    spec.layer.push(genMegaLayer(state.id));
  } else {
    spec.layer.push(genMegaLayer());
    spec.layer[spec.layer.length - 1].transform!.unshift(isState);
  }
  spec.layer.push(genLevelLayer(options));
  if (withStates) {
    spec.layer.push(genStateBorderLayer());
  }
  spec.layer.push(genLevelHoverLayer());
  spec.layer.push(genCreditsLayer());
  return spec;
}

/**
 * generates a map of the county and its related counties
 */
export function generateRelatedCountySpec(county: RegionInfo, options: CommonParams = {}): TopLevelSpec {
  const level = 'county';
  const topoJSON = countyJSON();

  const spec = genBaseSpec(level, topoJSON, options);

  const related = getRelatedCounties(county);
  spec.projection!.fit = {
    expr: `customInFilter(data('county'), 'id', ${JSON.stringify(related.map((d) => d.id))})`,
  };
  spec.projection!.extent = {
    // fit to match 60% in the center
    expr: `[[width * 0.2, height * 0.2], [width* 0.8, height * 0.8]]`,
  };
  // /**
  //  * @type {import('vega-lite/build/src/transform').Transform}
  //  */
  // const isRelevantCounty = {
  //   filter: [county, ...related].map((d) => `datum.id === '${d.id}'`).join(' || '),
  // };
  spec.datasets!.nation = nationJSON();
  spec.layer.push(genMissingLayer());
  spec.datasets!.state = stateJSON();
  spec.layer.push(genMegaLayer());
  spec.layer.push(genLevelLayer(options));
  spec.layer.push(genStateBorderLayer({ strokeWidth: 2 }));
  spec.layer.push(genMegaHoverLayer());
  spec.layer.push(genLevelHoverLayer());
  // highlight the selected one
  spec.layer[spec.layer.length - 1]!.encoding!.opacity!.condition = {
    test: {
      or: [
        {
          param: 'hover',
          empty: false,
        },
        `datum.id === '${county.id}'`,
      ],
    },
    value: 1,
  };
  spec.layer.push(genCreditsLayer());
  return spec;
}

// export function generateStateTileSpec(options = {}) {
//   const level = 'state';
//   const topoJSON = stateTilesJSON();

//   const spec = genBaseSpec(level, topoJSON, options);
//   spec.projection = {
//     type: 'identity',
//     reflectY: true,
//   };
//   spec.datasets.nation = nationTilesJSON();
//   spec.layer.push(genMissingLayer());
//   // state, msa
//   spec.layer.push(genLevelLayer(options));
//   spec.layer.push(genLevelHoverLayer());
//   /**
//    * @type {import('vega-lite/build/src/spec').NormalizedUnitSpec | import('vega-lite/build/src/spec').NormalizedLayerSpec}
//    */
//   const layer = {
//     mark: {
//       type: 'text',
//       align: 'center',
//       baseline: 'middle',
//     },
//     encoding: {
//       key: {
//         field: 'id',
//       },
//       longitude: {
//         field: 'properties.lon',
//         type: 'quantitative',
//       },
//       latitude: {
//         field: 'properties.lat',
//         type: 'quantitative',
//       },
//       text: {
//         field: 'propertyId',
//         type: 'nominal',
//       },
//     },
//   };
//   spec.layer.push(layer);
//   return spec;
// }