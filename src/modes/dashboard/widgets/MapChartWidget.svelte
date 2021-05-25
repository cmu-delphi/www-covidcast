<script>
  import Vega from '../../../components/vega/Vega.svelte';
  import WidgetCard, { DEFAULT_WIDGET_STATE } from './WidgetCard.svelte';
  import { getContext } from 'svelte';
  import DownloadMenu from '../../../components/DownloadMenu.svelte';
  import { getLevelInfo, stats } from '../../../stores';
  import { formatDateISO, formatDateYearDayOfWeekAbbr } from '../../../formats';
  import RegionMapTooltip from '../../../blocks/RegionMapTooltip.svelte';
  import {
    generateStateSpec,
    generateNationSpec,
    generateHHSSpec,
    generateHRRSpec,
    generateMSASpec,
    generateStateMapWithCountyDataSpec,
  } from '../../../specs/mapSpec';
  import { getInfoByName } from '../../../data/regions';
  import { highlightToRegions, WidgetHighlight } from '../highlight';
  import isEqual from 'lodash-es/isEqual';
  import { resolveHighlightedField } from '../../../specs/lineSpec';

  export let id = undefined;
  /**
   * @type {import("../../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../../stores/params").RegionLevel}
   */
  export let level;

  /**
   * two way binding
   * @type {import('../highlight').WidgetHighlight | null}
   */
  export let highlight = null;

  export let initialState = {
    ...DEFAULT_WIDGET_STATE,
    width: 2,
    height: 2,
  };

  /**
   * @type {import("../../../stores/params").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  /**
   * @param {import('../../../stores/params').RegionLevel} level
   * @param {import('../highlight').WidgetHighlight | null} highlight
   */
  function highlightToRegionsImpl(level, highlight) {
    const r = highlightToRegions(level, highlight);
    if (r) {
      return r.map((d) => d.propertyId.toLowerCase());
    }
    return undefined;
  }
  /**
   * @param {import('../../../stores/params').SensorParam} sensor
   * @param {import('../../../stores/params').RegionLevel} level
   * @param {import("../../../stores/params").DateParam} date
   */
  function generateSpec(sensor, level, date) {
    /**
     * @type {import('../../../specs/mapSpec').CommonParams}
     */
    const options = {
      domain: sensor.domain($stats, level),
      scheme: sensor.value.vegaColorScale,
      title: [
        `${sensor.name} in US ${getLevelInfo(level).labelPlural}`,
        `on ${formatDateYearDayOfWeekAbbr(date.value)}`,
      ],
      subTitle: sensor.unit,
      initialRegion: highlightToRegionsImpl(level, highlight),
      paddingTop: 60,
      interactiveHighlight: true,
    };
    const byLevel = {
      nation: generateNationSpec,
      state: generateStateSpec,
      hhr: generateHRRSpec,
      hhs: generateHHSSpec,
      county: generateStateMapWithCountyDataSpec,
      msa: generateMSASpec,
    };
    const generator = byLevel[level] || generateStateSpec;
    return generator(options);
  }

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").RegionLevel} level
   * @param {import("../../../stores/params").DateParam} date
   */
  function loadData(sensor, level, date) {
    return fetcher.fetch1SensorNRegions1Date(sensor, level, date.value);
  }

  $: shownLevel = level === 'nation' ? 'state' : level;
  $: spec = generateSpec(sensor, shownLevel, date);
  $: data = loadData(sensor, shownLevel, date);
  $: fileName = `${sensor.name}_${getLevelInfo(shownLevel).labelPlural}_${formatDateISO(date.value)}`;

  /**
   * @type {Vega }
   */
  let vegaRef = null;

  function onHover(evt) {
    const value = resolveHighlightedField(evt, 'geo_value');
    if (!value) {
      return;
    }
    const regionHighlight = new WidgetHighlight(sensor.value, getInfoByName(value, shownLevel), date.value);

    if (!regionHighlight.equals(highlight)) {
      highlight = regionHighlight;
    }
  }

  $: highlighted = highlight != null && highlight.matches(sensor.value, shownLevel, date.value);

  function updateVegaHighlight(highlight) {
    if (!vegaRef) {
      return;
    }
    const view = vegaRef.vegaDirectAccessor();
    if (!view) {
      return;
    }
    const values = highlightToRegionsImpl(shownLevel, highlight);
    const newValue = values
      ? {
          unit: 'layer_1',
          fields: view.signal('hover_tuple_fields'),
          values,
        }
      : null;
    const currentValues = (view.signal('hover_tuple') || { values: [] }).values;
    const newValues = values || [];
    if (isEqual(currentValues, newValues)) {
      return;
    }
    view.signal('hover_tuple', newValue);
    view.runAsync();
  }
  $: {
    updateVegaHighlight(highlight);
  }
</script>

<WidgetCard {initialState} {sensor} region="US {getLevelInfo(shownLevel).labelPlural}" {date} {id} on:state on:action>
  <Vega
    bind:this={vegaRef}
    {spec}
    {data}
    style="margin-top: -58px;"
    tooltip={RegionMapTooltip}
    tooltipProps={{ sensor }}
    on:signal_hover={onHover}
    signalListeners={['hover']}
  />
  <svelte:fragment slot="toolbar">
    <DownloadMenu {vegaRef} {data} {sensor} {fileName} advanced={false} />
  </svelte:fragment>
</WidgetCard>
