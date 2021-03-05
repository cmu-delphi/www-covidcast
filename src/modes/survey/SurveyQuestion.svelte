<script>
  import UIKitHint from '../../components/UIKitHint.svelte';
  import fileIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/file.svg';
  import linkIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/link.svg';
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  import HistoryLineChart from '../mobile/HistoryLineChart.svelte';
  import IndicatorOverview from '../mobile/IndicatorOverview.svelte';
  import { formatDateShortWeekdayAbbr } from '../../formats';
  import IndicatorStatsLine from '../mobile/IndicatorStatsLine.svelte';

  /**
   * question object
   * @type {import('./questions').Question}
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
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  $: sensor = question.sensorParam;

  $: dateRow = fetcher.fetch1Sensor1Region1DateDetails(sensor, region, date);
  $: trend = fetcher.fetchWindowTrend(sensor, region, date);

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
    window.UIkit.modal.alert(`
    <p>Use the following link to jump directly to this question:</p>
    <a href="${fullUrl}">${fullUrl}</a>`);
  }
</script>

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

  h3.header {
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
    margin: 0.6em 0;
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

  .no-data {
    letter-spacing: 0.75px;
    text-transform: uppercase;
    color: #ffffff;
    background: #f2994a;
    border-radius: 3px;
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

<article class:loading class="uk-card uk-card-default uk-card-small question-card">
  <div class="uk-card-header">
    <h3 class="uk-card-title">{question.category}</h3>
    <a href={question.learnMoreLink} class="uk-link-muted uk-text-small" title="Learn More">
      <span class="inline-svg-icon">
        {@html fileIcon}
      </span><span class="header-link-text">Learn More</span></a>
    <a
      href="#{question.anchor}"
      id={question.anchor}
      class="uk-link-muted uk-text-small"
      on:click|preventDefault={showShareLink}
      title="Share Link">
      <span class="inline-svg-icon">
        {@html linkIcon}
      </span>
      <span class="header-link-text"> Share Link </span>
    </a>
  </div>
  <div class="uk-card-body question-body">
    {#if noData}
      <div class="uk-alert no-data">
        <span class="inline-svg-icon">
          {@html warningIcon}
        </span>
        not enough data available
      </div>
    {/if}
    <div>
      <p class="question-question">
        {@html question.question}
      </p>
    </div>

    <p>
      On
      {formatDateShortWeekdayAbbr(date.value)}
      the 7 day average of
      <strong>{sensor.name}</strong>
      <UIKitHint title={question.signalTooltip} />
      was:
    </p>
    <IndicatorOverview {sensor} {date} {region} {fetcher} />

    <hr />
    <h3 class="header">{sensor.name} ({sensor.unit})</h3>

    <div class="chart-250">
      <HistoryLineChart {sensor} {date} {region} {fetcher} />
    </div>

    <IndicatorStatsLine {sensor} {date} {region} {fetcher} />
  </div>
</article>
