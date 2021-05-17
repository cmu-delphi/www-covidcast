<script>
  import FancyHeader from '../../components/FancyHeader.svelte';
  import Vega from '../../components/vega/Vega.svelte';
  import { loadBackFillProfile } from '../../data/indicatorInfo';
  import { TimeFrame, WINDOW_SIZE } from '../../stores/params';
  import {
    currentRegionInfo,
    selectByInfo,
    valueField,
    dateField,
    dateOptions,
    valueOptions,
    anchorLag,
    valueLabel,
    dateLabel,
    isRelative,
  } from './store';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import { backFillWeekdayDistribution, generateHeatMapSpec, backFillWeekdayFrequency } from './backfillSpec';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import Search from '../../components/Search.svelte';
  import OptionPicker from '../../components/OptionPicker.svelte';
  import { timeMonth } from 'd3-time';
import AboutSection from '../../components/AboutSection.svelte';

  /**
   * @type {import('../../data/indicatorInfo').IndicatorStatus}
   */
  export let indicator;
  $: date = indicator ? indicator.latest_time_value : new Date();
  $: window = new TimeFrame(timeMonth.offset(date, -WINDOW_SIZE), date);
  $: title = `${indicator.name} Backfill Profile`;

  $: options = {
    valueField: $valueField,
    valueLabel: $valueLabel,
    dateField: $dateField,
    dateLabel: $dateLabel,
    anchorLag: $anchorLag,
    isRelative: $isRelative,
  };

  let vegaRef = undefined;
  $: spec = generateHeatMapSpec({
    title: `${indicator.name}: ${$valueLabel} Profile`,
    ...options,
  });
  $: data = loadBackFillProfile(indicator, $currentRegionInfo || nationInfo, window, $anchorLag);

  $: weekdaySpec = backFillWeekdayDistribution({
    title: `${indicator.name}: ${$valueLabel}`,
    subTitle: `per Lag (Reporting Date - Reference Date) per weekday`,
    ...options,
  });
  let vegaRefWeekday = undefined;

  $: weekdayBoxplotSpec = backFillWeekdayFrequency({
    title: `${indicator.name}: ${$valueLabel}`,
    subTitle: `Lag Distribution to reach 90%`,
    ...options,
    completeness: 0.9,
  });
  let vegaRefBoxplot = undefined;
</script>

<Search
  modern
  className="grid-3 grid-span-8 uk-margin-top"
  placeholder="Search for state or country"
  items={[nationInfo, ...stateInfo, ...countyInfo]}
  title="Region"
  icon="location"
  selectedItem={$currentRegionInfo}
  labelFieldName="displayName"
  maxItemsToShowInList="5"
  on:change={(e) => selectByInfo(e.detail && e.detail.level === 'nation' ? null : e.detail)}
/>

<OptionPicker
  className="grid-3 grid-span-2 uk-margin-top"
  type="number"
  label="Anchor Lag (days)"
  bind:value={$anchorLag}
  min={1}
  max={60}
  step={10}
  modern
/>
<OptionPicker
  className="grid-5 grid-span-4 uk-margin-top"
  label="Tracked Value"
  bind:value={$valueField}
  options={$valueOptions}
  modern
/>
<OptionPicker
  className="grid-9 grid-span-2 uk-margin-top"
  label="Show By"
  bind:value={$dateField}
  options={dateOptions}
  modern
/>

<div class="grid-1 grid-span-12">
  <FancyHeader invert sub="Backfill Profile">{indicator.name}</FancyHeader>
  <AboutSection>

  </AboutSection>
  <div class="chart-300">
    <Vega bind:this={vegaRef} {spec} {data} />
    <DownloadMenu
      {vegaRef}
      {data}
      absolutePos="bottom: -20px"
      fileName={title.replace(/\s+/gm, '_')}
      advanced={false}
    />
  </div>
</div>
<div class="grid-1 {$isRelative ? 'grid-span-12' : 'grid-span-6'} uk-margin-top">
  <div class="chart-300">
    <Vega bind:this={vegaRefWeekday} spec={weekdaySpec} {data} />
    <DownloadMenu
      vegaRef={vegaRefWeekday}
      {data}
      absolutePos="bottom: -20px"
      fileName={title.replace(/\s+/gm, '_')}
      advanced={false}
    />
  </div>
</div>
{#if !$isRelative}
  <div class="grid-7 grid-span-6 uk-margin-top">
    <div class="chart-300">
      <Vega bind:this={vegaRefBoxplot} spec={weekdayBoxplotSpec} {data} />
      <DownloadMenu
        vegaRef={vegaRefBoxplot}
        {data}
        absolutePos="bottom: -20px"
        fileName={title.replace(/\s+/gm, '_')}
        advanced={false}
      />
    </div>
  </div>
{/if}
;
