<script>
  import UIKitHint from '../../components/UIKitHint.svelte';
  import fileIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/file.svg';
  import linkIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/link.svg';
  import HistoryLineChart from '../../blocks/HistoryLineChart.svelte';
  import IndicatorOverview from '../../blocks/IndicatorOverview.svelte';
  import { formatDateYearDayOfWeekAbbr } from '../../formats';
  import IndicatorStatsLine from '../../blocks/IndicatorStatsLine.svelte';
  import WarningBanner from '../../components/WarningBanner.svelte';
  import MaxDateHint from '../../blocks/MaxDateHint.svelte';
  import { metaDataManager } from '../../stores';
  import { SensorParam } from '../../stores/params';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import IndicatorRevision from './IndicatorRevision.svelte';

  /**
   * question object
   * @type {import('../../stores/questions').Question}
   */
  export let question;
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  export let anchor = null;

  $: sensor = new SensorParam($metaDataManager.getSensor(question), $metaDataManager);
  $: trend = fetcher.fetch1Sensor1Region1DateTrend(sensor, region, date);

  $: validRevisions = (question.oldRevisions || []).filter((revision) => {
    const s = $metaDataManager.getSensor(revision);
    if (!s) {
      if ($metaDataManager.metaSensors.length > 0) {
        console.error('invalid question revision config', revision);
      }
      return false;
    }
    return true;
  });

  let loading = false;
  let noData = false;
  $: {
    noData = false;
    loading = true;
    trend.then((t) => {
      loading = false;
      noData = t.min == null; // no min found no data at all
    });
  }

  function showShareLink() {
    const fullUrl = new URL(location.href);
    fullUrl.hash = `#${question.anchor}`;
    const t = document.createElement('div');
    t.textContent = fullUrl;
    window.UIkit.modal.alert(`
    <p>Use the following link to jump directly to this question:</p>
    <a href="${fullUrl}">${t.innerHTML}</a>`);
  }

  function extractFirstLink(links) {
    if (!links || links.length === 0) {
      return null;
    }
    const m = /href="(.*)"/gm.exec(links[0]);
    return m ? m[1] : null;
  }

  $: firstLink = extractFirstLink(sensor.value.links);
</script>

<article class:loading class="uk-card uk-card-default uk-card-small question-card">
  {#if anchor}
    <a href="#{anchor}" id={anchor} class="anchor"><span>Anchor</span></a>
  {/if}
  <a href="#{question.anchor}" id={question.anchor} class="anchor"><span>Anchor</span></a>
  <div class="uk-card-header">
    <h3 class="uk-card-title">{question.category}</h3>
    {#if firstLink}
      <a href={firstLink} class="uk-link-muted uk-text-small" title="Learn More">
        <span class="inline-svg-icon">
          {@html fileIcon}
        </span><span class="header-link-text">Learn More</span></a
      >
    {/if}
    <a
      href="#{question.anchor}"
      class="uk-link-muted uk-text-small"
      on:click|preventDefault={showShareLink}
      title="Share Link"
    >
      <span class="inline-svg-icon">
        {@html linkIcon}
      </span>
      <span class="header-link-text"> Share Link </span>
    </a>
  </div>
  <div class="uk-card-body question-body">
    {#if noData}
      <WarningBanner>not enough data available</WarningBanner>
    {/if}
    <div>
      <p class="question-question">
        {@html question.question}
      </p>
    </div>

    <p>
      On
      {formatDateYearDayOfWeekAbbr(date.value, true)}
      <MaxDateHint sensor={sensor.value} />
      the 7 day average of
      <strong>{sensor.name}</strong>
      <UIKitHint title={sensor.signalTooltip} inline />
      was:
    </p>
    <IndicatorOverview {sensor} {date} {region} {fetcher} />
    <p>
      The indicator <strong>{sensor.name}</strong> was added in
      <a href={question.addedInWave.link}>{question.addedInWave.name}</a>
      of the Delphi survey published on {formatDateYearDayOfWeekAbbr(question.addedInWave.published, true)}.
    </p>

    <hr />
    <div class="chart-300">
      <HistoryLineChart
        {sensor}
        {date}
        {region}
        {fetcher}
        stderr={sensor.value.hasStdErr}
        starts={question.addedInWave.published}
        showNeighbors={false}
      />
    </div>

    <IndicatorStatsLine {sensor} {date} {region} {fetcher} />

    {#if validRevisions.length > 0}
      <FancyHeader sub="Revisions">Previous</FancyHeader>
      {#each validRevisions as revision}
        <IndicatorRevision {revision} {date} {region} {fetcher} />
      {/each}
    {/if}
  </div>
</article>

<style>
  .question-card {
    margin-bottom: 2em;
    border-radius: 8px;
  }
  .uk-card-header {
    background: #f2f2f2;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
  }

  .uk-card-header > a {
    margin-left: 1em;
  }
  .uk-card-title {
    flex-grow: 1;
    margin: 0;
  }

  .question-question {
    font-style: italic;
    font-size: 2rem;
    line-height: 2.5rem;
  }

  .anchor {
    /** move anchor such that scrolling won't overlap with the sticky parameters */
    position: absolute;
    top: -160px;
    display: inline-block;
  }

  .anchor > span {
    display: none;
  }

  @media only screen and (max-width: 715px) {
    .question-question {
      font-size: 1.15rem;
      line-height: 1.5rem;
      font-weight: 600;
      font-style: normal;
    }

    .header-link-text {
      display: none;
    }
  }
</style>
