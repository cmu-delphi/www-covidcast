<script>
  import Vega from '../../../components/Vega.svelte';
  import WidgetCard from './WidgetCard.svelte';
  import { getContext } from 'svelte';
  import Toggle from '../../mobile/Toggle.svelte';
  import DownloadMenu from '../../mobile/components/DownloadMenu.svelte';
  import {
    generateLineChartSpec,
    generateLineAndBarSpec,
    genAnnotationLayer,
    resolveHighlightedDate,
    patchHighlightTuple,
  } from '../../../specs/lineSpec';
  import { annotationManager, isMobileDevice } from '../../../stores';
  import { joinTitle } from '../../../specs/commonSpec';
  import { combineSignals } from '../../../data/utils';
  import { formatDateISO } from '../../../formats';
  import { WidgetHighlight } from '../highlight';

  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  /**
   * @type {import("../../../stores/params").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  $: data = fetcher.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame);

  /**
   * @param {import('../../stores/params').SensorParam} sensor
   * @param {import('../../stores/params').RegionParam} region
   * @param {import('../../stores/params').DateParam} date
   * @param {import('../../stores/params').TimeFrame} timeFrame
   * @param {{zero: boolean, raw: boolean, isMobile: boolean}} options
   */
  function genSpec(sensor, region, date, timeFrame, { zero, raw, isMobile }) {
    /**
     * @type {import('../../../specs/lineSpec').LineSpecOptions}
     */
    const options = {
      initialDate: date.value,
      // color,
      domain: timeFrame.domain,
      zero,
      xTitle: sensor.xAxis,
      title: joinTitle([sensor.name, `in ${region.displayName}`], isMobile),
      subTitle: sensor.unit,
      highlightRegion: false,
      clearHighlight: false,
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

  let zoom = false;
  let singleRaw = false;

  $: annotations = $annotationManager.getWindowAnnotations(
    sensor.value,
    region,
    date.windowTimeFrame.min,
    date.windowTimeFrame.max,
  );
  $: raw = singleRaw && sensor.rawValue != null;
  $: spec = injectRanges(
    genSpec(sensor, region, date, date.windowTimeFrame, {
      zero: !zoom,
      raw,
      isMobile: $isMobileDevice,
    }),
    date.windowTimeFrame,
    annotations,
  );
  $: data = loadData(sensor, region, date.windowTimeFrame, raw);
  $: fileName = generateFileName(sensor, region, date.windowTimeFrame, raw);

  let vegaRef = null;

  function onHighlightSignal(event) {
    const date = resolveHighlightedDate(event);
    const newHighlight = new WidgetHighlight(sensor.value, region.value, date);
    if (!newHighlight.equals(highlight)) {
      highlight = newHighlight;
    }
  }

  // $: {
  //   updateHighlightedDate(highlight ? highlight)
  // }
</script>

<WidgetCard width={3} height={2}>
  <Vega
    bind:this={vegaRef}
    {spec}
    {data}
    signals={{ highlight_tuple: patchHighlightTuple }}
    signalListeners={['highlight']}
    on:signal_highlight={onHighlightSignal}
  />
  <div class="buttons">
    <Toggle bind:checked={zoom}>Rescale Y-axis</Toggle>
    {#if sensor.rawValue != null}
      <Toggle bind:checked={singleRaw}>Raw Data</Toggle>
    {/if}
    <div class="spacer" />
    <DownloadMenu {fileName} {vegaRef} {data} {sensor} {raw} advanced={false} />
  </div>
</WidgetCard>

<style>
  .buttons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .spacer {
    flex: 1 1 0;
  }
</style>
