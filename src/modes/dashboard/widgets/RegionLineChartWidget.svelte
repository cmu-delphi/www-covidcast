<script context="module">
  const DEFAULT_STATE = {
    ...DEFAULT_WIDGET_STATE,
    width: 3,
    height: 2,
    zero: true,
  };
</script>

<script>
  import Vega from '../../../components/vega/Vega.svelte';
  import WidgetCard, { DEFAULT_WIDGET_STATE } from './WidgetCard.svelte';
  import { getContext } from 'svelte';
  import DownloadMenu from '../../../components/DownloadMenu.svelte';
  import {
    generateCompareLineSpec,
    resolveHighlightedDate,
    patchHighlightTuple,
    generateDualAxisSpec,
  } from '../../../specs/lineSpec';
  import { formatDateISO, formatWeek } from '../../../formats';
  import { WidgetHighlight } from '../highlight';
  import isEqual from 'lodash-es/isEqual';
  import { createEventDispatcher } from 'svelte';
  import { EpiWeek } from '../../../data/EpiWeek';
  import { isComparableAcrossRegions } from '../../../data/sensor';
  import HistoryLineTooltip from '../../../blocks/HistoryLineTooltip.svelte';
  import Toggle from '../../../components/Toggle.svelte';

  const dispatch = createEventDispatcher();

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").TimeFrame}
   */
  export let timeFrame;
  /**
   * @type {import("../../../stores/params").RegionParam[]}
   */
  export let regions;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  export let initialState = DEFAULT_STATE;
  let zoom = !initialState.zero;

  $: canCompare = isComparableAcrossRegions(sensor.value);
  $: visibleRegions = canCompare ? regions : regions.slice(0, Math.min(2, regions.length));

  let superState = {};
  $: state = {
    ...initialState,
    ...superState,
    zero: !zoom,
  };
  $: {
    dispatch('state', { id, state });
  }
  function mergeState(event) {
    superState = event.detail.state;
  }

  /**
   * @type {import("../../../stores/DataFetcher").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  /**
   * @param {import('../highlight').WidgetHighlight | null} highlight
   */
  function highlightToDate(highlight) {
    return highlight ? highlight.primaryDate : null;
  }

  /**
   * @param {import('../../../stores/params').SensorParam} sensor
   * @param {import('../../../stores/params').RegionParam[]} regions
   * @param {import('../../../stores/params').TimeFrame} timeFrame
   * @param {{zero: boolean, canCompare: boolean}} options
   */
  function genSpec(sensor, regions, timeFrame, { canCompare, zero }) {
    const isWeekly = sensor.value.isWeeklySignal;
    /**
     * @type {import('../../../specs/lineSpec').LineSpecOptions}
     */
    const options = {
      initialDate: highlightToDate(highlight) || timeFrame.max,
      domain: timeFrame.domain,
      zero,
      valueFormat: sensor.value.formatSpecifier,
      xTitle: sensor.xAxis,
      title: [`${sensor.name}`, timeFrame.toNiceString(isWeekly)],
      subTitle: sensor.unit,
      highlightRegion: false,
      clearHighlight: false,
      autoAlignOffset: 60,
      paddingTop: 80,
      isWeeklySignal: isWeekly,
      compareField: 'displayName',
      tooltip: true,
    };
    const names = regions.map((region) => region.displayName);
    if (canCompare) {
      return generateCompareLineSpec(names, options);
    }
    return generateDualAxisSpec(names.slice(0, 1), names.slice(1), options);
  }

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").RegionParam[]} regions
   * @param {import("../../../stores/params").TimeFrame} timeFrame
   * @param {boolean} raw
   */
  function loadData(sensor, regions, timeFrame) {
    return fetcher.fetch1SensorNRegionsNDates(sensor, regions, timeFrame);
  }

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").Region region
   */
  function generateFileName(sensor, regions, timeFrame) {
    const regionName = regions.map((region) => `${region.propertyId}-${region.displayName}`);
    let suffix = '';
    return `${sensor.name}_${regionName}_${
      sensor.isWeeklySignal ? formatWeek(timeFrame.min_week) : formatDateISO(timeFrame.min)
    }-${sensor.isWeeklySignal ? formatWeek(timeFrame.max_week) : formatDateISO(timeFrame.max)}${suffix}`;
  }

  $: spec = genSpec(sensor, visibleRegions, timeFrame, { canCompare, zero: !zoom });
  $: data = loadData(sensor, visibleRegions, timeFrame);
  $: fileName = generateFileName(sensor, visibleRegions, timeFrame);

  let vegaRef = null;

  function onHighlightSignal(event) {
    const date = resolveHighlightedDate(event);
    const newHighlight = new WidgetHighlight(
      sensor.value,
      visibleRegions.map((r) => r.value),
      sensor.isWeeklySignal ? EpiWeek.fromDate(date) : date,
    );
    if (!newHighlight.equals(highlight)) {
      highlight = newHighlight;
    }
  }

  $: highlighted = highlight != null && highlight.matches(sensor.value, visibleRegions[0], timeFrame);

  function updateVegaHighlight(highlight) {
    if (!vegaRef) {
      return;
    }
    const view = vegaRef.vegaDirectAccessor();
    if (!view) {
      return;
    }
    const value = highlightToDate(highlight);
    const values = value ? [value.getTime()] : null;
    const newValue = value
      ? {
          unit: 'layer_1',
          fields: view.signal('highlight_tuple_fields'),
          values,
        }
      : null;
    const currentValues = (view.signal('highlight_tuple') || { values: [] }).values;
    const newValues = values || [];
    if (isEqual(currentValues, newValues)) {
      return;
    }
    view.signal('highlight_tuple', newValue);
    view.runAsync();
  }
  $: {
    updateVegaHighlight(highlight);
  }

  function joinLabels(regions) {
    if (regions.length === 0) {
      return 'Regions';
    }
    if (regions.length === 1) {
      return regions[0].displayName;
    }
    const r = regions
      .slice(0, regions.length - 1)
      .map((d) => d.displayName)
      .join(', ');
    return `${r} and ${regions[regions.length - 1].displayName}`;
  }
</script>

<WidgetCard
  {initialState}
  defaultState={DEFAULT_STATE}
  {highlighted}
  region={visibleRegions.length === 1 ? visibleRegions[0] : joinLabels(visibleRegions)}
  {sensor}
  date={timeFrame}
  {id}
  on:action
  on:state={mergeState}
  resizeMode="x"
>
  <Vega
    bind:this={vegaRef}
    {spec}
    {data}
    style="margin-top: -58px;"
    signals={{ highlight_tuple: patchHighlightTuple }}
    signalListeners={['highlight']}
    on:signal_highlight={onHighlightSignal}
    tooltip={HistoryLineTooltip}
    tooltipProps={{ sensor }}
  />
  <svelte:fragment slot="toolbar">
    <Toggle bind:checked={zoom} noPadding>Rescale Y-axis</Toggle>
    <DownloadMenu {fileName} {vegaRef} {data} {sensor} advanced={false} />
  </svelte:fragment>
</WidgetCard>
