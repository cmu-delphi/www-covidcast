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
  import { formatDateISO } from '../../../formats';
  import { WidgetHighlight } from '../highlight';
  import { createEventDispatcher } from 'svelte';
  import { EpiWeek } from '../../../data/EpiWeek';
  import { toSignalCompatibilityGroups } from '../../../data/sensor';
  import SensorsLineTooltip from '../../../blocks/SensorsLineTooltip.svelte';
  import Toggle from '../../../components/Toggle.svelte';
  import { highlightToDate, joinLabels, updateVegaHighlight } from './utils';

  const dispatch = createEventDispatcher();

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").SensorParam[]}
   */
  export let sensors;
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

  $: sensorGroups = toSignalCompatibilityGroups(sensors.map((s) => s.value));
  $: visibleSensors = sensorGroups.length > 2 ? sensorGroups.slice(0, 2) : sensorGroups;
  $: flatSensors = visibleSensors.flat();
  $: refSensor = flatSensors[0];

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
   * @param {import('../../../stores/params').Sensor[][]} sensors
   * @param {import('../../../stores/params').RegionParam} region
   * @param {import('../../../stores/params').TimeFrame} timeFrame
   * @param {{zero: boolean}} options
   */
  function genSpec(sensors, region, timeFrame, { zero }) {
    const flatSensors = sensors.flat();
    const isWeekly = sensors[0][0].isWeeklySignal;
    /**
     * @type {import('../../../specs/lineSpec').LineSpecOptions}
     */
    const options = {
      initialDate: highlightToDate(highlight) || timeFrame.max,
      domain: timeFrame.domain,
      zero,
      valueFormat: flatSensors[0].formatSpecifier,
      valueFormatRight: sensors.length > 1 ? sensors[1][0].formatSpecifier : undefined,
      xTitle: flatSensors[0].xAxis,
      title: [`${flatSensors[0].name} in ${region.displayName}`, timeFrame.toNiceString(isWeekly)],
      subTitle: sensors.map((s) => s[0].unit).join(', '),
      highlightRegion: false,
      clearHighlight: false,
      autoAlignOffset: 60,
      paddingTop: 80,
      isWeeklySignal: isWeekly,
      compareField: 'sensorName',
      legend: true,
      tooltip: true,
    };
    if (sensorGroups.length === 1) {
      return generateCompareLineSpec(
        sensors[0].map((d) => d.name),
        options,
      );
    }
    return generateDualAxisSpec(
      sensors[0].map((d) => d.name),
      sensors[1].map((d) => d.name),
      options,
    );
  }

  /**
   * @param {import("../../../stores/params").SensorParam[]} sensors
   * @param {import("../../../stores/params").RegionParam} regions
   * @param {import("../../../stores/params").TimeFrame} timeFrame
   * @param {boolean} raw
   */
  function loadData(flatSensors, region, timeFrame) {
    return Promise.all(fetcher.fetchNSensor1RegionNDates(flatSensors, region, timeFrame)).then((rows) => {
      rows.forEach((sensorRows, i) => {
        const sensor = flatSensors[i];
        sensorRows.forEach((row) => {
          row.sensorName = sensor.name;
        });
      });
      return rows.flat();
    });
  }

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").Region region
   */
  function generateFileName(sensors, region, timeFrame) {
    const names = sensors.map((sensor) => `${sensor.name}`);

    return `${names}_${region.displayName}_${formatDateISO(timeFrame.min)}-${formatDateISO(timeFrame.max)}`;
  }

  $: spec = genSpec(visibleSensors, region, timeFrame, { zero: !zoom });
  $: data = loadData(flatSensors, region, timeFrame);
  $: fileName = generateFileName(flatSensors, region, timeFrame);

  let vegaRef = null;

  function onHighlightSignal(event) {
    const date = resolveHighlightedDate(event);
    const newHighlight = new WidgetHighlight(
      refSensor,
      visibleSensors.map((r) => r.value),
      refSensor.isWeeklySignal ? EpiWeek.fromDate(date) : date,
    );
    if (!newHighlight.equals(highlight)) {
      highlight = newHighlight;
    }
  }

  $: highlighted = highlight != null && highlight.matches(refSensor, region, timeFrame);

  function updateVegaHighlightImpl(highlight) {
    updateVegaHighlight(vegaRef, highlight);
  }
  $: {
    updateVegaHighlightImpl(highlight);
  }
</script>

<WidgetCard
  {initialState}
  defaultState={DEFAULT_STATE}
  {highlighted}
  {region}
  sensor={flatSensors.length === 1
    ? flatSensors[0]
    : joinLabels(
        flatSensors.map((d) => d.name),
        'Indicators',
      )}
  titleUnit={visibleSensors.map((d) => d[0].unit).join(', ')}
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
    tooltip={SensorsLineTooltip}
    tooltipProps={{ sensors: flatSensors }}
  />
  <svelte:fragment slot="toolbar">
    <Toggle bind:checked={zoom} noPadding>Rescale Y-axis</Toggle>
    <DownloadMenu {fileName} {vegaRef} {data} advanced={false} />
  </svelte:fragment>
</WidgetCard>
