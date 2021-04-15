<script>
  import Vega from '../../../components/Vega.svelte';
  import WidgetCard from './WidgetCard.svelte';
  import { getContext } from 'svelte';
  import DownloadMenu from '../../mobile/components/DownloadMenu.svelte';
  import { getLevelInfo, isMobileDevice, stats } from '../../../stores';
  import { formatDateISO, formatDateYearWeekdayAbbr } from '../../../formats';
  import RegionMapTooltip from '../../mobile/RegionMapTooltip.svelte';
  import {
    generateStateSpec,
    generateNationSpec,
    generateHHSSpec,
    generateHRRSpec,
    generateMSASpec,
    generateStateMapWithCountyDataSpec,
  } from '../../../specs/mapSpec';
  import { joinTitle } from '../../../specs/commonSpec';

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

  /**
   * @type {import("../../../stores/params").DataFetcher}
   */
  const fetcher = getContext('fetcher');

  /**
   * @param {import('../../../stores/params').SensorParam} sensor
   * @param {import('../../../stores/params').RegionLevel} level
   * @param {import("../../../stores/params").DateParam} date
   */
  function generateSpec(sensor, level, date, { isMobile }) {
    /**
     * @type {import('../../../specs/mapSpec').CommonParams}
     */
    const options = {
      domain: sensor.domain($stats, level),
      scheme: sensor.isInverted ? 'yellowgreenblue' : 'yelloworangered',
      title: joinTitle(
        [`${sensor.name} in US ${getLevelInfo(level).labelPlural}`, `on ${formatDateYearWeekdayAbbr(date.value)}`],
        isMobile,
      ),
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
    return fetcher.fetch1SensorNRegions1Date(sensor, level, '*', date.value);
  }

  /**
   * @param {import("../../../stores/params").SensorParam} sensor
   * @param {import("../../../stores/params").RegionLevel level
   * @param {import("../../../stores/params").DateParam} date
   */
  function generateFileName(sensor, level, date) {
    return `${sensor.name}_${getLevelInfo(level).labelPlural}_${formatDateISO(date.value)}`;
  }

  $: shownLevel = level === 'nation' ? 'state' : level;
  $: spec = generateSpec(sensor, shownLevel, date, { isMobile: $isMobileDevice });
  $: data = loadData(sensor, shownLevel, date);
  $: fileName = generateFileName(sensor, shownLevel, date);

  let vegaRef = null;

  function onClickHandler(evt) {
    const item = evt.detail.item;
    if ($isMobileDevice || !item || !item.datum || !item.datum.propertyId) {
      return; // no click on mobile
    }
    // TODO
    // region.set(item.datum, true);
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
    tooltip={RegionMapTooltip}
    tooltipProps={{ sensor }}
    on:click={onClickHandler}
    eventListeners={['click']}
  />
  <DownloadMenu {vegaRef} {data} {sensor} absolutePos {fileName} />
</WidgetCard>

<style>
</style>
