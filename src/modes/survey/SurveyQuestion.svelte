<script>
  import Vega from '../../components/Vega.svelte';
  import UIKitHint from '../../components/UIKitHint.svelte';
  import fileIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/file.svg';
  import linkIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/link.svg';
  // import userEditIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/user-edit.svg';
  import calendarIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/regular/calendar.svg';
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  import { createTimeSeriesSpec, loadTimeSeriesData } from './timeSeries';
  import { determineTrend, findDateRow, findMaxRow, findMinRow } from './trend';

  import { formatDateShortOrdinal } from '../../formats';
  import { formatTrend, formatSampleSize, formatStdErr } from './format';
  import SurveyTrend from './SurveyTrend.svelte';
  import SurveyValue from './SurveyValue.svelte';
  import SurveyTooltip from './SurveyTooltip.svelte';
  import ShapeIcon from '../../components/ShapeIcon.svelte';
  import { isMobileDevice } from '../../stores';
  import { factor } from './questions';

  /**
   * question object
   * @type {import('./questions').Question}
   */
  export let question;

  /**
   * date to highlight
   * @type {Date}
   */
  export let date;

  /**
   * @type {import('./timeSeries').Params}
   */
  export let params;

  $: data = loadTimeSeriesData(question, params);
  $: spec = createTimeSeriesSpec(params);

  let loading = true;
  let noData = false;
  let maxDate = null;
  let refDate = null;

  async function deriveData(dataPromise, date) {
    loading = true;
    noData = false;
    const data = (await dataPromise) || [];
    loading = false;
    noData = data.length === 0;
    const dateRow = findDateRow(date, data);
    const trend = determineTrend(date, data, dateRow);
    const max = question.inverted ? findMinRow(data) : findMaxRow(data);
    maxDate = max ? max.date_value : null;
    refDate = trend.refDate;

    return {
      data,
      row: dateRow,
      trend,
      max,
    };
  }

  $: summary = deriveData(data, date);

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

  .uk-card-header > a {
    margin-left: 1em;
  }
  .uk-card-title {
    flex-grow: 1;
    margin: 0;
  }
  .question-body > :global(.vega-embed) {
    display: block;
    height: 7em;
  }
  .question-question {
    font-style: italic;
    font-size: 2rem;
  }

  .question-summary {
    margin-top: 1.5em;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
  }

  .question-summary > div {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.5;
    margin: 0 0.25em;
    max-width: 11em;
    text-align: center;
  }

  .question-kpi {
    height: 5rem;
    display: flex;
    margin-bottom: 0.5em;
  }

  .question-kpi-trend {
    flex-direction: column;
    justify-content: flex-end;
  }

  .block-date {
    margin: 0.5em 0;
  }

  .question-kpi-title {
    margin: 0.5em 0;
    white-space: nowrap;
  }

  .question-unit {
    flex-grow: 1;
    margin: 0.5em 0;
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

    .question-kpi {
      height: 3rem;
    }

    .question-kpi-title {
      font-weight: normal;
    }

    .block-date,
    .question-kpi-title,
    .question-unit {
      font-size: 0.8rem;
    }

    .chart-details {
      font-size: 0.75rem;
      font-style: normal;
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
    <h4>
      {question.name}
      <UIKitHint title={question.signalTooltip} />
    </h4>
    <Vega
      {spec}
      {data}
      scrollSpy={100}
      signals={{ currentDate: date, maxDate, refDate }}
      tooltip={SurveyTooltip}
      tooltipProps={{ question }} />
    <div class="uk-text-center uk-text-italic chart-details">
      {#await summary then s}
        {s.row ? `based on ${formatSampleSize(s.row)} survey responses with a standard error of ${formatStdErr(s.row.stderr)}` : ''}
      {/await}
    </div>
    <div class="question-summary">
      <div>
        <div class="question-kpi question-kpi-trend">
          {#await summary}
            <SurveyTrend trend={null} />
          {:then s}
            <SurveyTrend trend={s.trend} />
          {/await}
        </div>
        <div class="block-date">
          <span class="inline-svg-icon">{@html calendarIcon}</span>{formatDateShortOrdinal(refDate)}
        </div>
        <div class="uk-text-bold question-kpi-title">
          7-day trend
          <UIKitHint title="Tracks the variability of signal movenment" />
        </div>
        <div class="question-unit">
          {#await summary}
            N/A
          {:then s}
            {s.trend ? `${formatTrend(s.trend.change)} since ${formatDateShortOrdinal(refDate)}` : 'N/A'}
          {/await}
        </div>
      </div>
      <div>
        <div class="question-kpi">
          {#await summary}
            ?
          {:then s}
            <SurveyValue value={s.max ? s.max.value : null} {factor} />
          {/await}
        </div>
        <div class="block-date">
          <span class="inline-svg-icon">{@html calendarIcon}</span>{formatDateShortOrdinal(maxDate)}
        </div>
        <div class="uk-text-bold question-kpi-title">
          <ShapeIcon shape="diamond" color="gray" />
          {question.inverted ? 'Lowest' : 'Highest'}
          {#if !$isMobileDevice}count{/if}
        </div>
        <div class="question-unit">{question.unit}</div>
      </div>
      <div>
        <div class="question-kpi">
          {#await summary}
            N/A
          {:then s}
            <SurveyValue value={s.row ? s.row.value : null} {factor} />
          {/await}
        </div>
        <div class="block-date">
          <span class="inline-svg-icon">{@html calendarIcon}</span>{formatDateShortOrdinal(date)}
        </div>
        <div class="uk-text-bold question-kpi-title">
          <ShapeIcon shape="circle" color="#c00" />
          Selected
          {#if !$isMobileDevice}count{/if}
        </div>
        <div class="question-unit">{question.unit}</div>
      </div>
    </div>
  </div>
</article>
