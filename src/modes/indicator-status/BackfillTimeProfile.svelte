<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { loadBackFillProfile } from '../../data/indicatorInfo';
  import { DateParam } from '../../stores/params';
  import { currentRegionInfo, selectByInfo } from '../../stores';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import { generateHeatMapSpec } from './backfillSpec';
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

  export let referenceAnchorLag = 60;

  $: region = $currentRegionInfo || nationInfo;

  $: window = new DateParam(date).windowTimeFrame;

  $: data = loadBackFillProfile(indicator, region, window, referenceAnchorLag);

  let vegaRef = undefined;

  const dateOptions = [
    { label: 'Reported Date', value: 'date_value' },
    { label: 'Issue Date', value: 'issue_date' },
  ];
  let dateField = 'date_value';

  const valueOptions = [
    { label: 'Value Completeness', value: 'value_completeness' },
    { label: 'Relative Value Change', value: 'value_rel_change' },
    { label: 'Sample Size Completeness', value: 'sample_size_completeness' },
    { label: 'Relative Sample Size Change', value: 'sample_size_rel_change' },
  ];
  let valueField = 'value_completeness';

  $: title = `${indicator.name} Backfill Profile`;
  $: spec = generateHeatMapSpec(indicator, {
    title,
    valueField,
    valueLabel: valueOptions.find((d) => d.value == valueField).label,
    dateField,
    dateLabel: dateOptions.find((d) => d.value == dateField).label,
  });
</script>

<div class="grid-3-11">
  <hr />
  <FancyHeader invert sub="Backfill Profile">{indicator ? indicator.name : '?'}</FancyHeader>
</div>
<Search
  modern
  className="grid-3-8"
  placeholder="Select a region"
  items={[nationInfo, ...stateInfo, ...countyInfo]}
  title="Region"
  icon="location"
  selectedItem={region}
  labelFieldName="displayName"
  maxItemsToShowInList="5"
  on:change={(e) => selectByInfo(e.detail && e.detail.level === 'nation' ? null : e.detail)}
/>
<OptionPicker className="8-11" label="Color" bind:value={valueField} options={valueOptions} />
<OptionPicker className="8-11" label="Date" bind:value={dateField} options={dateOptions} />

<div class="grid-3-11">
  <div class="chart-300">
    <Vega bind:this={vegaRef} {spec} {data} className="chart-breakout" />
    <DownloadMenu {vegaRef} {data} absolutePos fileName={title.replace(/\s+/gm, '_')} advanced={false} />
  </div>
</div>
