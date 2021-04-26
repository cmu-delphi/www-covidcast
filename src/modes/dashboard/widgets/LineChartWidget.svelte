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
  import { annotationManager } from '../../../stores';
  import { combineSignals } from '../../../data/utils';
  import { formatDateISO, formatDateShortWeekdayAbbr, formatDateYearWeekdayAbbr } from '../../../formats';
  import { WidgetHighlight } from '../highlight';
  import isEqual from 'lodash-es/isEqual';
  import { createEventDispatcher } from 'svelte';

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

  export let initialState = {
    ...DEFAULT_WIDGET_STATE,
    width: 3,
    height: 2,
    zero: true,
    raw: false,
  };

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
    superState = event.detail;
  }

  /**
   * @type {import("../../../stores/params").DataFetcher}
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
    /**
     * @type {import('../../../specs/lineSpec').LineSpecOptions}
     */
    const options = {
      initialDate: highlightToDate(highlight) || timeFrame.max,
      // color,
      domain: timeFrame.domain,
      zero,
      xTitle: sensor.xAxis,
      title: [
        `${sensor.name} in ${region.displayName}`,
        `between ${formatDateYearWeekdayAbbr(timeFrame.min)} and ${formatDateShortWeekdayAbbr(timeFrame.max)}`,
      ],
      subTitle: sensor.unit,
      highlightRegion: false,
      clearHighlight: false,
      autoAlignOffset: 60,
      paddingTop: 80,
      infoLabelExpr: raw
        ? `cachedNumber(datum.value, '.1f') + ' (raw: ' + cachedNumber(datum.raw, '.1f') + ') @ ' + cachedTime(datum.date_value, '%a %b %d')`
        : `cachedNumber(datum.value, '.1f') + ' @ ' + cachedTime(datum.date_value, '%a %b %d')`,
    };
    if (raw) {
      return generateLineAndBarSpec(options);
    }
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
      return combineSignals(data, data[0], ['smoothed', 'raw']);
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
    return `${sensor.name}_${regionName}_${formatDateISO(timeFrame.min)}-${formatDateISO(timeFrame.max)}${suffix}`;
  }

  function injectRanges(spec, timeFrame, annotations) {
    if (annotations.length > 0) {
      spec.layer.unshift(genAnnotationLayer(annotations, timeFrame));
    }
    return spec;
  }

  $: annotations = $annotationManager.getWindowAnnotations(sensor.value, region, timeFrame.min, timeFrame.max);
  $: raw = singleRaw && sensor.rawValue != null;
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
    const newHighlight = new WidgetHighlight(sensor.value, region.value, date);
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
  {highlighted}
  {sensor}
  {region}
  date={timeFrame}
  {id}
  on:close
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
