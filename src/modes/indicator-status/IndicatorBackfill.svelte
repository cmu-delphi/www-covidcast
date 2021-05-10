<script>
  import FancyHeader from '../../components/FancyHeader.svelte';
  import Vega from '../../components/vega/Vega.svelte';
  import { loadBackFillProfile } from '../../data/indicatorInfo';
  import { TimeFrame, WINDOW_SIZE } from '../../stores/params';
  import { currentRegionInfo, selectByInfo } from '../../stores';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import { backFillWeekdayDistribution, generateHeatMapSpec, backFillWeekdayFrequency } from './backfillSpec';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import Search from '../../components/Search.svelte';
  import OptionPicker from '../../components/OptionPicker.svelte';
  import { timeMonth } from 'd3-time';

  /**
   * @type {import('../../data/indicatorInfo').IndicatorStatus}
   */
  export let indicator;

  $: region = $currentRegionInfo || nationInfo;

  $: date = indicator ? indicator.latest_time_value : new Date();
  $: window = new TimeFrame(timeMonth.offset(date, -WINDOW_SIZE), date);

  const dateOptions = [
    { label: 'Reported Date', value: 'date_value' },
    { label: 'Issue Date', value: 'issue_date' },
  ];
  let dateField = 'date_value';
  $: dateLabel = dateOptions.find((d) => d.value == dateField).label;

  const valueOptions = [
    { label: 'Value Completeness', value: 'value_completeness' },
    { label: 'Relative Value Change', value: 'value_rel_change' },
    { label: 'Sample Size Completeness', value: 'sample_size_completeness' },
    { label: 'Relative Sample Size Change', value: 'sample_size_rel_change' },
  ];
  let valueField = 'value_completeness';
  $: valueLabel = valueOptions.find((d) => d.value == valueField).label;

  let anchorLagStr = '60';
  $: anchorLag = Number.parseInt(anchorLagStr, 10);

  $: title = `${indicator.name} Backfill Profile`;

  let vegaRef = undefined;
  $: spec = generateHeatMapSpec({
    title: `${indicator.name}: ${valueLabel} Profile`,
    valueField,
    valueLabel,
    dateField,
    dateLabel,
  });
  $: data = loadBackFillProfile(indicator, region, window, anchorLag);

  $: isRelative = valueField.endsWith('_rel_change');

  $: weekdaySpec = backFillWeekdayDistribution({
    title: `${indicator.name}: ${valueLabel}`,
    valueField,
    valueLabel,
    dateField,
    dateLabel,
    anchorLag,
  });
  let vegaRefWeekday = undefined;

  $: weekdayBoxplotSpec = backFillWeekdayFrequency({
    title: `${indicator.name}: ${valueLabel}`,
    valueField,
    dateField,
    dateLabel,
    anchorLag,
    completeness: 0.9,
  });
  let vegaRefBoxplot = undefined;
</script>

<Search
  modern
  className="grid-3 grid-span-8 uk-margin-top"
  placeholder="Select a region"
  items={[nationInfo, ...stateInfo, ...countyInfo]}
  title="Region"
  icon="location"
  selectedItem={region}
  labelFieldName="displayName"
  maxItemsToShowInList="5"
  on:change={(e) => selectByInfo(e.detail && e.detail.level === 'nation' ? null : e.detail)}
/>
<OptionPicker
  className="grid-3 grid-span-4 uk-margin-top"
  label="Color"
  bind:value={valueField}
  options={valueOptions}
  modern
/>
<OptionPicker
  className="grid-7 grid-span-2 uk-margin-top"
  label="Date"
  bind:value={dateField}
  options={dateOptions}
  modern
/>
<OptionPicker
  className="grid-9 grid-span-2 uk-margin-top"
  type="number"
  label="Anchor Lag (days)"
  bind:value={anchorLag}
  min={1}
  max={60}
  step={10}
  modern
/>

<div class="grid-1 grid-span-12">
  <FancyHeader invert sub="Backfill Profile">{indicator.name}</FancyHeader>
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
<div class="grid-1 {isRelative ? 'grid-span-12' : 'grid-span-6'} uk-margin-top">
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
{#if !isRelative}
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
