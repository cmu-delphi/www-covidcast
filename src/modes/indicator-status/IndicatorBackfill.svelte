<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { loadBackFillProfile } from '../../data/indicatorInfo';
  import { TimeFrame, WINDOW_SIZE } from '../../stores/params';
  import {
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
  import {
    backFillDayOfWeekDistribution,
    generateChangeHeatMapSpec,
    generateValueHeatMapSpec,
    backFillDayOfWeekFrequency,
  } from './backfillSpec';
  import { nationInfo } from '../../data/regions';
  import OptionPicker from '../../components/OptionPicker.svelte';
  import { timeMonth } from 'd3-time';
  import BackfillTooltip from './BackfillTooltip.svelte';
  import AboutSection from '../../components/AboutSection.svelte';
  import { metaDataManager } from '../../stores';

  /**
   * @type {import('../../data/sensor').Sensor}
   */
  export let sensor;

  export let region;

  $: date = $metaDataManager.getTimeFrame(sensor).max;
  $: window = new TimeFrame(timeMonth.offset(date, -WINDOW_SIZE), date);
  $: title = `${sensor.name} Backfill Profile in ${(region || nationInfo).displayName}`;

  $: options = {
    valueField: $valueField,
    valueLabel: $valueLabel,
    dateField: $dateField,
    dateLabel: $dateLabel,
    anchorLag: $anchorLag,
    isRelative: $isRelative,
  };

  let vegaRef = undefined;
  $: spec = $isRelative
    ? generateChangeHeatMapSpec({
        title: `${sensor.name}: ${$valueLabel}`,
        ...options,
      })
    : generateValueHeatMapSpec({
        title: `${sensor.name}: ${$valueLabel}`,
        ...options,
      });
  $: data = loadBackFillProfile(sensor, region || nationInfo, window, $anchorLag);

  $: dayOfWeekSpec = backFillDayOfWeekDistribution({
    title: `${sensor.name}: ${$valueLabel}`,
    subTitle: `per Lag (Reporting Date - Reference Date) per day of week`,
    ...options,
  });
  let vegaRefDayOfWeek = undefined;

  $: dayOfWeekBoxplotSpec = backFillDayOfWeekFrequency({
    title: `${sensor.name}: ${$valueLabel}`,
    subTitle: `Lag Distribution to reach 90%`,
    ...options,
    completeness: 0.9,
  });
  let vegaRefBoxplot = undefined;
</script>

<AboutSection className="uk-margin-small-bottom">
  <h3 class="mobile-h3">About Backfill Profiling</h3>

  <div class="desc">
    The backfill profile illustrates the data collection patterns of the selected indicator. The <strong
      >Reference Date</strong
    >
    is the date of the activity being measured (e.g., "Date of Service" for doctor visits, or "specimen collection date"
    for lab test results). The <strong>Reporting Date</strong> is the date on which the specific value was reported to
    Delphi. There can be multiple reporting dates for the same reference date due to backfill. For example, additional
    doctor visits for a specific reference date has been updated after the initial number of doctor visits has been
    reported to Delphi. Thus, Delphi issues another reporting date with the new value.
    <strong>Anchor Lag</strong> is the number of days after the reference date in which it is assumed for this backfill profiling
    that the value is not going to change much anymore.
  </div>
</AboutSection>

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

{#if $isRelative}
  <AboutSection details className="uk-margin-small-top uk-margin-small-bottom">
    <h3 slot="header" class="mobile-h3">Day-to-day Backfill Heatmap</h3>
    <div class="desc">
      The Backfill heatmap illustrates the day-to-day value change per date per lag. The horizontal time axis shows
      either the reporting or reference date based on the selection of the user. The vertical lag axis illustrates the
      number of days when the value has been reported relative to the horizontal time value. The cell at the crossing
      point is colored according to the relative value change illustrating how newly reported values changes move per
      reference date over time.
    </div>
  </AboutSection>
{:else}
  <AboutSection details className="uk-margin-small-top uk-margin-small-bottom">
    <h3 slot="header" class="mobile-h3">Fraction Backfill Heatmap</h3>
    <div class="desc">
      The Backfill heatmap is using the selected anchor lag to illustrate the fraction of value per date per lag. The
      horizontal time axis shows either the reporting or reference date based on the selection of the user. The vertical
      lag axis illustrates the number of days when the value has been reported relative to the horizontal time value.
      The cell at the crossing point is colored according to the fraction of how the reported value is relative to the
      reported value at the selected anchor lag. The anchor lag that is used as the basis of the specific date value is
      shown as a blue line. This heatmap gives insights on what number of lags are needed for this indicator to reach a
      certain fraction close to the assumed final value.
    </div>
  </AboutSection>
{/if}

<div class="grid-1 grid-span-12">
  <div class="chart-300">
    <Vega bind:this={vegaRef} {spec} {data} tooltip={BackfillTooltip} tooltipProps={{ options }} />
    <DownloadMenu
      {vegaRef}
      {data}
      absolutePos="bottom: -20px"
      fileName={title.replace(/\s+/gm, '_')}
      advanced={false}
    />
  </div>
</div>
<AboutSection details className="uk-margin-small-top uk-margin-small-bottom">
  <h3 slot="header" class="mobile-h3">Day of Week Distributions</h3>
  <div class="desc">
    In order to highlight day of week changes within reported values of the selected indicator the following charts are
    stratified by day of week. The horizontal axis shows the lag while the vertical axis shows the fraction of value or
    the day-to-day change based on the selection of the. Both values are described before. The line chart shows the
    median fraction of value at the selected anchor lag. The vertical blue axis is showing the selected anchor date.
    This chart gives insights on whether there are interesting day of week differences in the indicator.
    {#if !$isRelative}
      The second chart shows a similar view to highlight on the day of week distribution but focuses on the distribution
      per day of week when the first reported lag reached 90% of the fraction of the target anchor lag value. This
      illustrates whether the anchor lag is a fitting choice when the box-plots are clearly below the anchor lag line in
      blue.
    {/if}
  </div>
</AboutSection>
<div class="grid-1 {$isRelative ? 'grid-span-12' : 'grid-span-6'} uk-margin-top">
  <div class="chart-300">
    <Vega bind:this={vegaRefDayOfWeek} spec={dayOfWeekSpec} {data} />
    <DownloadMenu
      vegaRef={vegaRefDayOfWeek}
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
      <Vega bind:this={vegaRefBoxplot} spec={dayOfWeekBoxplotSpec} {data} />
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
