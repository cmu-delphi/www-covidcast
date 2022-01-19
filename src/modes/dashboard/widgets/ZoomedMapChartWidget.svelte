<script>
  import Vega from '../../../components/vega/Vega.svelte';
  import WidgetCard, { DEFAULT_WIDGET_STATE } from './WidgetCard.svelte';
  import { getContext } from 'svelte';
  import DownloadMenu from '../../../components/DownloadMenu.svelte';
  import { getLevelInfo } from '../../../stores/constants';
  import { formatDateISO, formatDateYearDayOfWeekAbbr, formatWeek } from '../../../formats';
  import RegionMapTooltip from '../../../blocks/RegionMapTooltip.svelte';
  import {
    generateStateSpec,
    generateHHSSpec,
    generateHRRSpec,
    generateMSASpec,
    generateCountiesOfStateSpec,
    generateRelatedCountySpec,
  } from '../../../specs/mapSpec';
  import { getCountiesOfState, getInfoByName } from '../../../data/regions';
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
   * @type {import("../../../stores/params").Region}
   */
  export let region;

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
   * @type {import("../../../stores/DataFetcher").DataFetcher}
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
   * @param {import('../../../stores/params').Region} region
   * @param {import("../../../stores/params").DateParam} date
   */
  function generateSpec(sensor, region, level, date) {
    /**
     * @type {import('../../../specs/mapSpec').CommonParams}
     */
    const options = {
      ...sensor.vegaSchemeDomain(level),
      title: [
        `${sensor.name} in US ${getLevelInfo(level).labelPlural}`,
        `on ${sensor.isWeeklySignal ? formatWeek(date.week) : formatDateYearDayOfWeekAbbr(date.value)}`,
      ],
      subTitle: sensor.unit,
      initialRegion: highlightToRegionsImpl(level, highlight),
      paddingTop: 60,
      valueFormat: sensor.value.formatSpecifier,
      interactiveHighlight: true,
      withStates: true,
    };

    if (region.level === 'state') {
      return generateCountiesOfStateSpec(region, options);
    }
    if (region.level === 'county') {
      return generateRelatedCountySpec(region, options);
    }
    const byLevel = {
      hrr: generateHRRSpec,
      hhs: generateHHSSpec,
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
  function loadData(sensor, region, level, date) {
    const levelData = fetcher.fetch1SensorNRegions1Date(sensor, level, date.value);
    if (region.level === 'state') {
      const counties = getCountiesOfState(region.value);
      const countyData = fetcher.fetch1SensorNRegions1Date(
        sensor,
        [...counties, getInfoByName(`${region.id}000`)],
        date,
      );
      return Promise.all([countyData, levelData]).then((r) => r.flat());
    }
    return levelData;
  }

  $: level = region.level === 'nation' ? 'state' : region.level;
  $: highlightLevel = region.level === 'state' ? 'county' : level;
  $: spec = generateSpec(sensor, region, level, date);
  $: data = loadData(sensor, region, level, date);
  $: fileName = `${sensor.name}_${getLevelInfo(level).labelPlural}_${
    sensor.isWeeklySignal ? formatWeek(date.week) : formatDateISO(date.value)
  }`;

  /**
   * @type {Vega }
   */
  let vegaRef = null;

  function onHover(evt) {
    const value = resolveHighlightedField(evt, 'geo_value');
    if (!value) {
      return;
    }
    const regionHighlight = new WidgetHighlight(
      sensor.value,
      getInfoByName(value, highlightLevel),
      sensor.isWeeklySignal ? date.week : date.value,
    );

    if (!regionHighlight.equals(highlight)) {
      highlight = regionHighlight;
    }
  }

  $: highlighted =
    highlight != null &&
    highlight.matches(sensor.value, highlightLevel, sensor.isWeeklySignal ? date.week : date.value);

  function updateVegaHighlight(highlight) {
    if (!vegaRef) {
      return;
    }
    const view = vegaRef.vegaDirectAccessor();
    if (!view) {
      return;
    }
    const values = highlightToRegionsImpl(highlightLevel, highlight);
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

<WidgetCard {initialState} {sensor} region="US {getLevelInfo(level).labelPlural}" {date} {id} on:state on:action>
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
