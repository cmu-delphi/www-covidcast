<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { loadBackFillProfile } from '../../data/indicatorInfo';
  import { DateParam } from '../../stores/params';
  import { currentRegionInfo, selectByInfo } from '../../stores';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import { backFillWeekdayDistribution, generateHeatMapSpec } from './backfillSpec';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import Search from '../../components/Search.svelte';
  import OptionPicker from '../../components/OptionPicker.svelte';

  /**
   * @type {import('../../data/indicatorInfo').IndicatorStatus}
   */
  export let indicator;

  /**
   * @type {Date}
   */
  export let date;

  $: region = $currentRegionInfo || nationInfo;

  $: window = new DateParam(date).windowTimeFrame;

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
  const anchorLagOptions = [
    { label: '60 days', value: '60' },
    { label: '30 days', value: '30' },
    { label: '7 days', value: '7' },
  ];
  $: anchorLag = Number.parseInt(anchorLagStr, 10);

  $: title = `${indicator.name} Backfill Profile`;

  let vegaRef = undefined;
  $: spec = generateHeatMapSpec({
    title: `${indicator.name} ${valueLabel} Profile`,
    valueField,
    valueLabel,
    dateField,
    dateLabel,
  });
  $: data = loadBackFillProfile(indicator, region, window, anchorLag);

  $: weekdaySpec = backFillWeekdayDistribution({
    title: `${indicator.name} ${valueLabel} per Lag by weekday`,
    valueField,
    valueLabel,
    dateField,
    dateLabel,
    anchorLag,
  });
  let vegaRefWeekday = undefined;
</script>

<div class="grid-3-11">
  <hr />
  <FancyHeader invert sub="Backfill Profile">{indicator.name}</FancyHeader>
</div>
<Search
  modern
  className="grid-1-7"
  placeholder="Select a region"
  items={[nationInfo, ...stateInfo, ...countyInfo]}
  title="Region"
  icon="location"
  selectedItem={region}
  labelFieldName="displayName"
  maxItemsToShowInList="5"
  on:change={(e) => selectByInfo(e.detail && e.detail.level === 'nation' ? null : e.detail)}
/>
<div class="grid-7-13">
  <OptionPicker label="Color" bind:value={valueField} options={valueOptions} modern />
  <OptionPicker label="Date" bind:value={dateField} options={dateOptions} modern />
  <OptionPicker label="Anchor Lag" bind:value={anchorLagStr} options={anchorLagOptions} modern />
</div>

<div class="grid-3-11">
  <div class="chart-300">
    <Vega bind:this={vegaRef} {spec} {data} className="chart-breakout" />
    <DownloadMenu {vegaRef} {data} absolutePos fileName={title.replace(/\s+/gm, '_')} advanced={false} />
  </div>
</div>

<div class="grid-1-7">
  <div class="chart-300">
    <Vega bind:this={vegaRefWeekday} spec={weekdaySpec} {data} />
    <DownloadMenu vegaRef={vegaRefWeekday} {data} absolutePos fileName={title.replace(/\s+/gm, '_')} advanced={false} />
  </div>
</div>
<div class="grid-7-13">
  <div class="chart-300">
    <!-- <Vega bind:this={vegaRef} {spec} {data} className="chart-breakout" />
    <DownloadMenu {vegaRef} {data} absolutePos fileName={title.replace(/\s+/gm, '_')} advanced={false} /> -->
  </div>
</div>
