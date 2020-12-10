<script>
  import Vega from '../../components/Vega.svelte';
  import UIKitHint from '../../components/UIKitHint.svelte';
  import fileIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/file.svg';
  import linkIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/link.svg';
  import userEditIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/user-edit.svg';
  import calendarIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/regular/calendar.svg';
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  import { createTimeSeriesSpec, loadTimeSeriesData } from './timeSeries';
  import { determineTrend, findDateRow, findMaxRow, findMinRow } from './trend';
  import { unitLong, unit } from './questions';
  import { formatDateShortAbbr } from '../../formats';
  import { formatDelta, formatIssueDate, formatSampleSize, formatStdErr } from './format';
  import SurveyTrend from './SurveyTrend.svelte';
  import SurveyValue from './SurveyValue.svelte';

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
    const data = await dataPromise;
    noData = data.length === 0;
    const dateRow = findDateRow(date, data);
    const trend = determineTrend(date, data, dateRow);
    const max = question.inverted ? findMinRow(data) : findMaxRow(data);
    maxDate = max ? max.date_value : null;
    refDate = trend.refDate;
    loading = false;

    return {
      data,
      row: dateRow,
      trend,
      max,
    };
  }

  $: summary = deriveData(data, date);
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
  .question-question-name {
    font-size: 1.25rem;
    font-style: italic;
  }
  .question-question {
    font-style: italic;
    font-size: 2rem;
  }

  .question-summary {
    margin-top: 1.5em;
    margin-bottom: 2em;
    display: flex;
    flex-wrap: wrap;
  }
  .question-summary > div {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.5;
    margin: 0 2em;
    text-align: center;
  }
  .question-kpi {
    height: 5rem;
    display: flex;
  }
  .question-unit {
    height: 4em;
  }

  .no-data {
    letter-spacing: 0.75px;
    text-transform: uppercase;
    color: #ffffff;
    background: #f2994a;
    border-radius: 3px;
  }
</style>

<article class:loading class="uk-card uk-card-default uk-card-small question-card">
  <div class="uk-card-header">
    <h3 class="uk-card-title">{question.name}</h3>
    <a href={question.learnMoreLink} class="uk-link-muted uk-text-small">
      <span class="inline-svg-icon">
        {@html fileIcon}
      </span>Learn More</a>
    <a href="#{question.anchor}" id={question.anchor} class="uk-link-muted uk-text-small">
      <span class="inline-svg-icon">
        {@html linkIcon}
      </span>
      Share Link
    </a>
  </div>
  <div class="uk-card-body question-body">
    {#if noData}
      <div class="uk-alert no-data">
        <span class="inline-svg-icon">
          {@html warningIcon}
        </span>
        not enough data availible
      </div>
    {/if}
    <div>
      <div class="question-question-name">
        <span class="inline-svg-icon">
          {@html userEditIcon}
        </span>
        Survey Question
      </div>
      <p class="question-question">{question.question}</p>
    </div>
    <h4>
      {question.signalName}
      <UIKitHint title={question.signalTooltip} />
    </h4>
    <Vega {spec} {data} signals={{ currentDate: date, maxDate, refDate }} />
    <div class="uk-text-center uk-text-italic">
      {#await summary then s}
        {s.row ? `based on ${formatSampleSize(s.row)} samples with a standard error of ${formatStdErr(s.row.stderr)}, published ${formatIssueDate(s.row)}` : ''}
      {/await}
    </div>
    <div class="question-summary">
      <div>
        <div class="question-kpi">
          {#await summary}
            <SurveyTrend trend={null} />
          {:then s}
            <SurveyTrend trend={s.trend ? s.trend.trend : null} />
          {/await}
        </div>
        <div class="uk-text-bold">
          Historical trend
          <UIKitHint title="Tracks the varability of signal movenment" />
        </div>
        <div class="question-unit">
          {#await summary}N/A{:then s}{s.trend ? `${formatDelta(s.trend.delta)} ${unit} since` : 'N/A'}{/await}
        </div>
        <div class="block-date">
          <span class="inline-svg-icon">{@html calendarIcon}</span>{formatDateShortAbbr(refDate)}
        </div>
      </div>
      <div>
        <div class="question-kpi">
          {#await summary}
            N/A
          {:then s}
            <SurveyValue value={s.row ? s.row.value : null} />
          {/await}
        </div>
        <div class="uk-text-bold">Current count</div>
        <div class="question-unit">{unitLong}</div>
        <div class="block-date">
          <span class="inline-svg-icon">{@html calendarIcon}</span>{formatDateShortAbbr(date)}
        </div>
      </div>
      <div>
        <div class="question-kpi">
          {#await summary}
            ?
          {:then s}
            <SurveyValue value={s.max ? s.max.value : null} />
          {/await}
        </div>
        <div class="uk-text-bold">{question.inverted ? 'Lowest count' : 'Highest count'}</div>
        <div class="question-unit">{unitLong}</div>
        <div class="block-date">
          <span class="inline-svg-icon">{@html calendarIcon}</span>{formatDateShortAbbr(maxDate)}
        </div>
      </div>
    </div>
  </div>
</article>
