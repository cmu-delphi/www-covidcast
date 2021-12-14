<script context="module">
  const DEFAULT_STATE = {
    ...DEFAULT_WIDGET_STATE,
    width: 3,
    height: 2,
    zero: true,
    raw: false,
  };
</script>

<script>
  import Vega from '../../../components/vega/Vega.svelte';
  import WidgetCard, { DEFAULT_WIDGET_STATE } from './WidgetCard.svelte';
  import { getContext } from 'svelte';
  import Toggle from '../../../components/Toggle.svelte';
  import DownloadMenu from '../../../components/DownloadMenu.svelte';
  import {
    generateLineChartSpec,
    generateLineAndBarSpec,
    genAnnotationLayer,
    resolveHighlightedDate,
    patchHighlightTuple,
  } from '../../../specs/lineSpec';
  import { annotationManager, getLevelInfo } from '../../../stores';
  import { combineSignals } from '../../../data/utils';
  import { formatDateISO, formatWeek } from '../../../formats';
  import { WidgetHighlight } from '../highlight';
  import isEqual from 'lodash-es/isEqual';
  import { createEventDispatcher } from 'svelte';
  import { EpiWeek } from '../../../data/EpiWeek';

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
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  export let initialState = DEFAULT_STATE;

  let zoom = !initialState.zero;
  let singleRaw = initialState.raw;

  let superState = {};
  $: state = {
    ...initialState,
    ...superState,
    zero: !zoom,
    raw: singleRaw,
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
   * @param {import('../../../stores/params').RegionParam} region
   * @param {import('../../../stores/params').TimeFrame} timeFrame
   * @param {{zero: boolean, raw: boolean}} options
   */
  function genSpec(sensor, region, timeFrame, { zero, raw }) {
    const isWeekly = sensor.value.isWeeklySignal;
    /**
     * @type {import('../../../specs/lineSpec').LineSpecOptions}
     */
    const options = {
      initialDate: highlightToDate(highlight) || timeFrame.max,
      color: getLevelInfo(region.level).color,
      domain: timeFrame.domain,
      zero,
      valueFormat: sensor.value.formatSpecifier,
      xTitle: sensor.xAxis,
      title: [`${sensor.name} in ${region.displayName}`, timeFrame.toNiceString(isWeekly)],
      subTitle: sensor.unit,
      highlightRegion: false,
      clearHighlight: false,
      autoAlignOffset: 60,
      paddingTop: 80,
      isWeeklySignal: isWeekly,
    };
    const valueTooltip = `cachedNumber(datum.value, '${sensor.value.formatSpecifier}') + `;
    const dateTooltip = isWeekly
      ? `' @ ' + toString(datum.week_value)`
      : `' @ ' + cachedTime(datum.date_value, '%a %b %d')`;
    const rawTooltip = `' (raw: ' + cachedNumber(datum.raw, '${sensor.value.formatSpecifier}')`;
    if (raw) {
      options.infoLabelExpr = `${valueTooltip} ${rawTooltip} + ')' + ${dateTooltip}`;
      return generateLineAndBarSpec(options);
    }
    options.infoLabelExpr = valueTooltip + dateTooltip;
    return generateLineChartSpec(options);
  }

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").TimeFrame} timeFrame
   * @param {boolean} raw
   */
  function loadData(sensor, region, timeFrame, raw) {
    const selfData = fetcher.fetch1Sensor1RegionNDates(sensor, region, timeFrame);

    if (!raw) {
      return selfData;
    }

    const rawData = fetcher.fetch1Sensor1RegionNDates(sensor.rawValue, region, timeFrame);
    return Promise.all([selfData, rawData]).then((data) => {
      return combineSignals(
        data,
        data[0].map((d) => ({ ...d })),
        ['smoothed', 'raw'],
      );
    });
  }

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").Region region
   */
  function generateFileName(sensor, region, timeFrame, raw) {
    const regionName = `${region.propertyId}-${region.displayName}`;
    let suffix = '';
    if (raw) {
      suffix = '_RawVsSmoothed';
    }
    return `${sensor.name}_${regionName}_${
      sensor.isWeeklySignal ? formatWeek(timeFrame.min_week) : formatDateISO(timeFrame.min)
    }-${sensor.isWeeklySignal ? formatWeek(timeFrame.max_week) : formatDateISO(timeFrame.max)}${suffix}`;
  }

  function injectRanges(spec, timeFrame, annotations) {
    if (annotations.length > 0) {
      spec.layer.unshift(genAnnotationLayer(annotations, timeFrame));
    }
    return spec;
  }

  $: raw = singleRaw && sensor.rawValue != null;

  $: annotations = $annotationManager.getWindowAnnotations(sensor.value, region, timeFrame.min, timeFrame.max);
  $: spec = injectRanges(
    genSpec(sensor, region, timeFrame, {
      zero: !zoom,
      raw,
    }),
    timeFrame,
    annotations,
  );
  $: data = loadData(sensor, region, timeFrame, raw);
  $: fileName = generateFileName(sensor, region, timeFrame, raw);

  let vegaRef = null;

  function onHighlightSignal(event) {
    const date = resolveHighlightedDate(event);
    const newHighlight = new WidgetHighlight(
      sensor.value,
      region.value,
      sensor.isWeeklySignal ? EpiWeek.fromDate(date) : date,
    );
    if (!newHighlight.equals(highlight)) {
      highlight = newHighlight;
    }
  }

  $: highlighted = highlight != null && highlight.matches(sensor.value, region.value, timeFrame);

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
</script>

<WidgetCard
  {initialState}
  defaultState={DEFAULT_STATE}
  {highlighted}
  {sensor}
  {region}
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
  />
  <svelte:fragment slot="toolbar">
    <Toggle bind:checked={zoom} noPadding>Rescale Y-axis</Toggle>
    {#if sensor.rawValue != null}
      <Toggle bind:checked={singleRaw} noPadding>Raw Data</Toggle>
    {/if}
    <DownloadMenu {fileName} {vegaRef} {data} {sensor} {raw} advanced={false} />
  </svelte:fragment>
</WidgetCard>
