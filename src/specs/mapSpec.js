import getRelatedCounties from '../maps/related';
import { EPIDATA_CASES_OR_DEATH_VALUES } from '../stores/constants';
import { commonConfig, CREDIT } from './commonSpec';

export const MISSING_COLOR = '#eeeeee';
const ZERO_COLOR = 'rgb(242,242,242)';

const MAP_THEME = {
  hoverRegionOutline: '#cccccc',
  stateOutline: '#ffffff',
};

const NAME_INFO_KEYS = ['propertyId', 'displayName', 'population', 'state', 'level'];
const EPIDATA_ROW_KEYS = ['geo_value', 'value', 'date_value', 'time_value', 'stderr', 'sample_size'].concat(
  EPIDATA_CASES_OR_DEATH_VALUES,
  NAME_INFO_KEYS,
);

const missingStopCount = 70;
const missingGradient = {
  // x1: 0,
  // y1: 0,
  // y2: 1,
  // x2: 2,
  gradient: 'linear',
  stops: Array(missingStopCount + 1)
    .fill(0)
    .map((_, i) => ({ offset: i / missingStopCount, color: i % 2 === 0 ? MISSING_COLOR : 'white' })),
};

function genCreditsLayer({ shift = 55 } = {}) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
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
  return layer;
}

function genMissingLayer(missingLevel = 'nation') {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
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
  return layer;
}

function genMegaLayer(withStates = null) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
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
    selection: {
      hoverMega: {
        type: 'single',
        on: 'mouseover',
        empty: 'none',
        fields: ['geo_value'],
      },
    },
  };
  return layer;
}

function genStateBorderLayer({ strokeWidth = 1.1 } = {}) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
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
  return layer;
}

function genMegaHoverLayer(alsoOnCounties = false) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
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
                    selection: 'hoverMega',
                  },
                  'hover && hover.geo_value && hover.geo_value[0] && slice(hover.geo_value[0], 0, 2) === slice(datum.id, 0, 2)',
                ],
              },
              value: 1,
            }
          : {
              selection: 'hoverMega',
              value: 1,
            },
        value: 0,
      },
    },
  };
  return layer;
}

function genLevelLayer({ strokeWidth = 1, scheme = 'yellowgreenblue', domain = undefined } = {}) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
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
          fontWeight: 'normal',
          titleAnchor: 'end',
          labelLimit: 30,
          tickMinStep: 0.1,
          titleFontWeight: 'normal',
          gradientLength: 280,
          gradientThickness: 8,
        },
      },
    },
    selection: {
      hover: {
        type: 'single',
        on: 'mouseover, click',
        empty: 'none',
        fields: ['geo_value'],
      },
    },
  };
  return layer;
}

function genLevelHoverLayer({ strokeWidth = 3 } = {}) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    mark: {
      type: 'geoshape',
      stroke: MAP_THEME.hoverRegionOutline,
      strokeWidth,
      opacity: 0,
      fill: null,
      tooltip: false,
    },
    // transform: [
    //   {
    //     filter: {
    //       selection: 'hover'
    //     }
    //   }
    // ],
    encoding: {
      key: {
        field: 'id',
      },
      opacity: {
        // more performant
        condition: {
          selection: 'hover',
          value: 1,
        },
        value: 0,
      },
    },
  };
  return layer;
}

function genBaseSpec(level, topoJSON, { height = 300 }) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    height,
    padding: {
      left: 10,
      bottom: 55,
      top: 10,
      right: 10,
    },
    autosize: {
      type: 'none',
      contains: 'padding',
      resize: true,
    },
    projection: {
      type: 'albersUsaTerritories',
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
    config: commonConfig,
  };
  return spec;
}

function countyJSON() {
  return import(/* webpackChunkName: 'shape-county' */ './shapefiles/county.json').then((r) => r.default);
}
function nationJSON() {
  return import(/* webpackChunkName: 'shape-nation' */ './shapefiles/nation.json').then((r) => r.default);
}
function stateJSON() {
  return import(/* webpackChunkName: 'shape-state' */ './shapefiles/state.json').then((r) => r.default);
}

export function generateStateSpec(options = {}) {
  const level = 'state';
  const topoJSON = stateJSON();

  const spec = genBaseSpec(level, topoJSON, options);
  spec.datasets.nation = nationJSON();
  spec.layer.push(genMissingLayer());

  // state, msa
  spec.layer.push(genLevelLayer(options));
  spec.layer.push(genCreditsLayer());
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

/**
 * generates a map of counties
 */
export function generateStateMapWithCountyDataSpec(options = {}) {
  const level = 'county';
  const topoJSON = countyJSON();

  const spec = genBaseSpec(level, topoJSON, options);

  spec.datasets.nation = nationJSON();
  spec.layer.push(genMissingLayer());
  spec.datasets.state = stateJSON();
  spec.layer.push(genMegaLayer());
  spec.layer.push(genLevelLayer({ ...options, strokeWidth: 0 }));
  spec.layer.push(genCreditsLayer());
  spec.layer.push(genStateBorderLayer());
  spec.layer.push(genMegaHoverLayer(true));
  spec.layer.push(genLevelHoverLayer({ strokeWidth: 1 }));
  return spec;
}

/**
 * generates a map of counties for a specific state
 * @param {import('../maps').NameInfo} state
 */
export function generateCountiesOfStateSpec(state, { withStates = false, ...options } = {}) {
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
  spec.transform.unshift(isCountyOfState);

  spec.datasets.nation = nationJSON();
  spec.layer.push(genMissingLayer());
  spec.datasets.state = stateJSON();

  if (withStates) {
    spec.projection.fit = {
      signal: `customInFilter(data('state'), 'id', ["${state.id}"])`,
    };
    spec.layer.push(genMegaLayer(state.id));
  } else {
    spec.layer.push(genMegaLayer());
    spec.layer[spec.layer.length - 1].transform.unshift(isState);
  }
  spec.layer.push(genLevelLayer(options));
  spec.layer.push(genCreditsLayer());
  if (withStates) {
    spec.layer.push(genStateBorderLayer());
  }
  spec.layer.push(genLevelHoverLayer());
  return spec;
}

/**
 * generates a map of the county and its related counties
 * @param {import('../maps').NameInfo} county
 */
export function generateRelatedCountySpec(county, options = {}) {
  const level = 'county';
  const topoJSON = countyJSON();

  const spec = genBaseSpec(level, topoJSON, options);

  const related = getRelatedCounties(county);
  spec.projection.fit = {
    signal: `customInFilter(data('county'), 'id', ${JSON.stringify(related.map((d) => d.id))})`,
  };
  // /**
  //  * @type {import('vega-lite/build/src/transform').Transform}
  //  */
  // const isRelevantCounty = {
  //   filter: [county, ...related].map((d) => `datum.id === '${d.id}'`).join(' || '),
  // };
  spec.datasets.nation = nationJSON();
  spec.layer.push(genMissingLayer());
  spec.datasets.state = stateJSON();
  spec.layer.push(genMegaLayer());
  spec.layer.push(genLevelLayer(options));
  spec.layer.push(genStateBorderLayer({ strokeWidth: 2 }));
  spec.layer.push(genCreditsLayer());
  spec.layer.push(genMegaHoverLayer());
  spec.layer.push(genLevelHoverLayer());
  // highlight the selected one
  spec.layer[spec.layer.length - 1].encoding.opacity.condition = {
    test: {
      or: [
        {
          selection: 'hover',
        },
        `datum.id === '${county.id}'`,
      ],
    },
    value: 1,
  };
  return spec;
}
