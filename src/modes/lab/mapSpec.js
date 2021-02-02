import { countyInfo, hrrInfo, megaCountyInfo, nationInfo, stateInfo, msaInfo } from '../../maps';
import countyJSON from './maps2/county.json';
import hrrJSON from './maps2/hrr.json';
import nationJSON from './maps2/nation.json';
import stateJSON from './maps2/state.json';
import msaJSON from './maps2/msa.json';

function genMissingLayer() {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    data: {
      name: 'nation',
      format: {
        type: 'topojson',
        feature: 'nation',
      },
    },
    mark: {
      type: 'geoshape',
      stroke: '#eaeaea',
      color: {
        y2: 1,
        gradient: 'linear',
        stops: [
          { offset: 0, color: '#eeeeee' },
          { offset: 0.014285714285714285, color: 'white' },
          { offset: 0.02857142857142857, color: '#eeeeee' },
          { offset: 0.04285714285714286, color: 'white' },
          { offset: 0.05714285714285714, color: '#eeeeee' },
          { offset: 0.07142857142857142, color: 'white' },
          { offset: 0.08571428571428572, color: '#eeeeee' },
          { offset: 0.1, color: 'white' },
          { offset: 0.11428571428571428, color: '#eeeeee' },
          { offset: 0.12857142857142856, color: 'white' },
          { offset: 0.14285714285714285, color: '#eeeeee' },
          { offset: 0.15714285714285714, color: 'white' },
          { offset: 0.17142857142857143, color: '#eeeeee' },
          { offset: 0.18571428571428572, color: 'white' },
          { offset: 0.2, color: '#eeeeee' },
          { offset: 0.21428571428571427, color: 'white' },
          { offset: 0.22857142857142856, color: '#eeeeee' },
          { offset: 0.24285714285714285, color: 'white' },
          { offset: 0.2571428571428571, color: '#eeeeee' },
          { offset: 0.2714285714285714, color: 'white' },
          { offset: 0.2857142857142857, color: '#eeeeee' },
          { offset: 0.3, color: 'white' },
          { offset: 0.3142857142857143, color: '#eeeeee' },
          { offset: 0.32857142857142857, color: 'white' },
          { offset: 0.34285714285714286, color: '#eeeeee' },
          { offset: 0.35714285714285715, color: 'white' },
          { offset: 0.37142857142857144, color: '#eeeeee' },
          { offset: 0.38571428571428573, color: 'white' },
          { offset: 0.4, color: '#eeeeee' },
          { offset: 0.4142857142857143, color: 'white' },
          { offset: 0.42857142857142855, color: '#eeeeee' },
          { offset: 0.44285714285714284, color: 'white' },
          { offset: 0.45714285714285713, color: '#eeeeee' },
          { offset: 0.4714285714285714, color: 'white' },
          { offset: 0.4857142857142857, color: '#eeeeee' },
          { offset: 0.5, color: 'white' },
          { offset: 0.5142857142857142, color: '#eeeeee' },
          { offset: 0.5285714285714286, color: 'white' },
          { offset: 0.5428571428571428, color: '#eeeeee' },
          { offset: 0.5571428571428572, color: 'white' },
          { offset: 0.5714285714285714, color: '#eeeeee' },
          { offset: 0.5857142857142857, color: 'white' },
          { offset: 0.6, color: '#eeeeee' },
          { offset: 0.6142857142857143, color: 'white' },
          { offset: 0.6285714285714286, color: '#eeeeee' },
          { offset: 0.6428571428571429, color: 'white' },
          { offset: 0.6571428571428571, color: '#eeeeee' },
          { offset: 0.6714285714285714, color: 'white' },
          { offset: 0.6857142857142857, color: '#eeeeee' },
          { offset: 0.7, color: 'white' },
          { offset: 0.7142857142857143, color: '#eeeeee' },
          { offset: 0.7285714285714285, color: 'white' },
          { offset: 0.7428571428571429, color: '#eeeeee' },
          { offset: 0.7571428571428571, color: 'white' },
          { offset: 0.7714285714285715, color: '#eeeeee' },
          { offset: 0.7857142857142857, color: 'white' },
          { offset: 0.8, color: '#eeeeee' },
          { offset: 0.8142857142857143, color: 'white' },
          { offset: 0.8285714285714286, color: '#eeeeee' },
          { offset: 0.8428571428571429, color: 'white' },
          { offset: 0.8571428571428571, color: '#eeeeee' },
          { offset: 0.8714285714285714, color: 'white' },
          { offset: 0.8857142857142857, color: '#eeeeee' },
          { offset: 0.9, color: 'white' },
          { offset: 0.9142857142857143, color: '#eeeeee' },
          { offset: 0.9285714285714286, color: 'white' },
          { offset: 0.9428571428571428, color: '#eeeeee' },
          { offset: 0.9571428571428572, color: 'white' },
          { offset: 0.9714285714285714, color: '#eeeeee' },
          { offset: 0.9857142857142858, color: 'white' },
          { offset: 1, color: '#eeeeee' },
        ],
      },
    },
  };
  return layer;
}

function genMegaLayer(infos) {
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
      { calculate: "datum.id + '000'", as: 'id' },
      {
        lookup: 'id',
        from: {
          data: { values: infos },
          key: 'id',
          fields: ['propertyId', 'displayName', 'population'],
        },
      },
      {
        calculate: 'lower(datum.propertyId)',
        as: 'propertyId',
      },
      {
        lookup: 'propertyId',
        from: {
          data: { name: 'values' },
          key: 'geo_value',
          fields: ['geo_value', 'value'],
        },
      },
    ],
    mark: {
      type: 'geoshape',
      stroke: null,
    },
    encoding: {
      color: {
        condition: {
          test: 'datum.value === 0',
          value: 'rgb(242,242,242)',
        },
        field: 'value',
        type: 'quantitative',
      },
    },
  };
  return layer;
}

function genStateBorderLayer() {
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
      color: 'transparent',
      stroke: '#eaeaea',
      strokeWidth: 1.1,
    },
  };
  return layer;
}

function genLevelLayer(level, infos, extraTransform = []) {
  /**
   * @type {import('vega-lite/build/src/spec').UnitSpec | import('vega-lite/build/src/spec').LayerSpec}
   */
  const layer = {
    data: {
      name: level,
      format: {
        type: 'topojson',
        feature: level,
      },
    },
    transform: [
      ...extraTransform,
      {
        lookup: 'id',
        from: {
          data: { values: infos },
          key: 'id',
          fields: ['propertyId', 'displayName', 'population'],
        },
      },
      {
        calculate: 'lower(datum.propertyId)',
        as: 'propertyId',
      },
      {
        lookup: 'propertyId',
        from: {
          data: { name: 'values' },
          key: 'geo_value',
          fields: ['geo_value', 'value'],
        },
      },
    ],
    mark: {
      type: 'geoshape',
      stroke: '#eaeaea',
      opacity: 1,
      tooltip: { content: 'data' },
    },
    encoding: {
      color: {
        condition: {
          test: 'datum.value === 0',
          value: 'rgb(242,242,242)',
        },
        field: 'value',
        type: 'quantitative',
        scale: {
          // domainMin: 0,
          // domainMax: 149,
          scheme: 'yelloworangered',
          clamp: true,
        },
        legend: {
          orient: 'right',
          titleAlign: 'center',
          titleFontWeight: 'normal',
          titleOrient: 'left',
          title: 'of 100 people',
          labelLimit: 30,
          tickMinStep: 0.1,
        },
      },
      stroke: {
        condition: { selection: 'hover', value: '#ff7f00' },
        value: '#eaeaea',
      },
      strokeWidth: {
        condition: { selection: 'hover', value: 2 },
        value: level === 'county' ? 0 : 1,
      },
    },
    selection: {
      hover: {
        type: 'single',
        on: 'mouseover',
        empty: 'none',
        fields: ['geo_value'],
      },
    },
  };
  return layer;
}

function genBaseSpec(title, level, topoJSON) {
  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  const spec = {
    title: title,
    height: 300,
    padding: {
      left: 10,
      bottom: 10,
      top: 10,
      right: 10,
    },
    projection: {
      type: 'albersUsaTerritories',
    },
    datasets: {
      values: [],
      [level]: topoJSON,
    },
    layer: [],
    config: {
      view: {
        stroke: null,
      },
      title: {
        anchor: 'start',
        fontWeight: 'normal',
        fontSize: 32,
      },
    },
  };
  return spec;
}

export function generateHRRSpec(title) {
  const level = 'hrr';
  const topoJSON = hrrJSON;
  const infos = hrrInfo;

  const spec = genBaseSpec(title, level, topoJSON);
  spec.datasets.nation = nationJSON;
  spec.layer.push(genMissingLayer());

  spec.layer.push(genLevelLayer(level, infos));
  return spec;
}

export function generateStateSpec(title) {
  const level = 'state';
  const topoJSON = stateJSON;
  const infos = stateInfo;

  const spec = genBaseSpec(title, level, topoJSON);
  spec.datasets.nation = nationJSON;
  spec.layer.push(genMissingLayer());

  // state, msa
  spec.layer.push(genLevelLayer(level, infos));
  return spec;
}

export function generateMSASpec(title) {
  const level = 'msa';
  const topoJSON = msaJSON;
  const infos = msaInfo;

  const spec = genBaseSpec(title, level, topoJSON);
  spec.datasets.nation = nationJSON;
  spec.layer.push(genMissingLayer());

  // state, msa
  spec.layer.push(genLevelLayer(level, infos));
  return spec;
}

export function generateNationSpec(title) {
  const level = 'nation';
  const topoJSON = nationJSON;
  const infos = [nationInfo];

  const spec = genBaseSpec(title, level, topoJSON);

  spec.layer.push(
    genLevelLayer(level, infos, [
      {
        calculate: JSON.stringify('us'),
        as: 'id',
      },
    ]),
  );
  return spec;
}

export function generateCountySpec(title) {
  const level = 'county';
  const topoJSON = countyJSON;
  const infos = countyInfo;

  const spec = genBaseSpec(title, level, topoJSON);

  spec.datasets.nation = nationJSON;
  spec.layer.push(genMissingLayer());
  spec.datasets.state = stateJSON;
  spec.layer.push(genMegaLayer(megaCountyInfo));
  spec.layer.push(genLevelLayer(level, infos));
  spec.layer.push(genStateBorderLayer());
  return spec;
}
