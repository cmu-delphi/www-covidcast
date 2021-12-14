import { updateHash } from '../../stores/urlHandler';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { trackEvent } from '../../stores/ga';

export type WidgetType =
  | 'line'
  | 'map'
  | 'hex'
  | 'regiontable'
  | 'datetable'
  | 'sensortable'
  | 'kpi'
  | 'regionpcp'
  | 'datepcp'
  | 'anomalies'
  | 'zoomedmap';

export type WidgetFocus = 'time' | 'region' | 'indicator';
export type WidgetCategory = 'chart' | 'table' | 'simple' | 'advanced';
export type WidgetConfigOption = 'sensor' | 'region' | 'timeFrame' | 'date' | 'level' | 'sensors';

export interface Widget {
  id: WidgetType;
  name: string;
  focus: readonly WidgetFocus[];
  type: WidgetCategory;

  configOptions: readonly WidgetConfigOption[];
}

export interface WidgetComponent {
  id: string;
  type: WidgetType;
  config: Record<string, unknown>;
  state: Record<string, unknown>;
}

export interface IState {
  title?: string;
  order: string[];
  states: Record<string, WidgetComponent['state']>;
  configs: Record<string, WidgetComponent['config']>;
}

const BASE_STATE: IState = {
  order: ['map_2', 'regiontable_3', 'line_5'],
  states: {
    line_5: { width: 5, height: 2, zero: true, raw: false },
    regiontable_3: { width: 2, height: 3, sortCriteria: 'name', sortCriteriaDesc: true },
    map_2: { width: 3, height: 3 },
  },
  configs: {
    map_2: {
      level: 'state',
    },
  },
};

export function resolveInitialState(): IState {
  if (!location.hash) {
    return BASE_STATE;
  }
  try {
    const s = JSON.parse(decompressFromEncodedURIComponent(location.hash.slice(1))!) as unknown as IState;
    return {
      ...BASE_STATE,
      ...s,
    };
  } catch {
    console.error('invalid state in hash');
    return BASE_STATE;
  }
}

export function updateState(state: IState): void {
  updateHash(compressToEncodedURIComponent(JSON.stringify(state)));
}

function asWidget(
  id: WidgetType,
  name: string,
  focus: readonly WidgetFocus[],
  type: WidgetCategory,
  configOptions: readonly WidgetConfigOption[],
): Widget {
  return { id, name, focus, type, configOptions };
}

export const widgets: readonly Widget[] = [
  asWidget('line', 'Time Series', ['time'], 'chart', ['sensor', 'region', 'timeFrame']),
  asWidget('map', 'Choropleth Map', ['region'], 'chart', ['sensor', 'level', 'date']),
  asWidget('zoomedmap', 'Zoomed Choropleth Map', ['region'], 'chart', ['sensor', 'region', 'date']),
  asWidget('hex', 'Hexagon Map', ['region'], 'chart', ['sensor', 'date']),
  asWidget('regiontable', 'Region Table', ['region'], 'table', ['sensor', 'level', 'date']),
  asWidget('datetable', 'Date Table', ['time'], 'table', ['sensor', 'region', 'timeFrame']),
  asWidget('sensortable', 'Indicator Table', ['indicator'], 'table', ['region', 'date']),
  asWidget('kpi', 'Value', [], 'simple', ['sensor', 'region', 'date']),
  asWidget('regionpcp', 'Region Parallel Coordinate Plot', ['region', 'indicator'], 'advanced', [
    'sensors',
    'level',
    'date',
  ]),
  asWidget('datepcp', 'Date Parallel Coordinate Plot', ['time', 'indicator'], 'advanced', [
    'sensors',
    'region',
    'timeFrame',
  ]),
  asWidget('anomalies', 'Data Anomalies', ['time', 'indicator'], 'simple', ['sensor', 'region', 'timeFrame']),
];

export function deriveType(id: string): WidgetType {
  return id.split('_')[0] as WidgetType;
}

export function findWidget(type: WidgetType): Widget {
  return widgets.find((d) => d.id === type) ?? widgets[0];
}

export function deriveComponents(state: IState): WidgetComponent[] {
  return state.order.map((id): WidgetComponent => {
    return {
      id,
      type: deriveType(id),
      config: state.configs[id] || {},
      state: state.states[id],
    };
  });
}
export function changeWidgetState(state: IState, id: string, newState: WidgetComponent['state']): IState {
  const info = findWidget(deriveType(id));
  trackEvent('dashboard', 'change_widget_state', info.name, JSON.stringify(newState));
  return {
    ...state,
    states: {
      ...state.states,
      [id]: newState,
    },
  };
}
export function changeWidgetConfig(state: IState, id: string, newConfig: WidgetComponent['config']): IState {
  const info = findWidget(deriveType(id));
  trackEvent('dashboard', 'change_widget_config', info.name, JSON.stringify(newConfig));

  const oldConfig = state.configs[id] || {};
  info.configOptions.forEach((option) => {
    const value = newConfig[option];
    if (value != oldConfig[option]) {
      trackEvent('dashboard', `use_${option}`, info.name, String(value));
    }
  });

  return {
    ...state,
    configs: {
      ...state.configs,
      [id]: newConfig,
    },
  };
}

export function removeWidget(state: IState, id: string): IState {
  const states = { ...state.states };
  delete states[id];
  const configs = { ...state.configs };
  delete configs[id];

  const info = findWidget(deriveType(id));
  trackEvent('dashboard', 'remove_widget', info.name, id);

  return {
    ...state,
    order: state.order.filter((d) => d !== id),
    states,
    configs,
  };
}

export function addWidget(
  state: IState,
  id: string,
  newConfig?: WidgetComponent['config'],
  newState?: WidgetComponent['state'],
): IState {
  const states = { ...state.states };
  if (newState) {
    states[id] = newState;
  }
  const configs = { ...state.configs };
  if (newConfig) {
    configs[id] = newConfig;
  }
  const info = findWidget(deriveType(id));
  trackEvent('dashboard', 'add_widget', info.name, JSON.stringify(newConfig));
  if (newConfig) {
    info.configOptions.forEach((option) => {
      const value = newConfig[option];
      if (value) {
        trackEvent('dashboard', `use_${option}`, info.name, String(value));
      }
    });
  }

  return {
    ...state,
    order: [...state.order, id],
    states,
    configs,
  };
}

export function changeOrder(state: IState, order: string[]): IState {
  trackEvent('dashboard', 'change_order', order.map((d) => deriveType(d)).join(','));
  return {
    ...state,
    order,
  };
}

export function changeTitle(state: IState, title: string): IState {
  trackEvent('dashboard', 'change_title', title);
  return {
    ...state,
    title,
  };
}
