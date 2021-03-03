<script>
  // import Vega from '../../components/Vega.svelte';
  import UIKitHint from '../../components/UIKitHint.svelte';
  import fileIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/file.svg';
  import linkIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/link.svg';
  // import userEditIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/user-edit.svg';
  import calendarIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/regular/calendar.svg';
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  // import { createTimeSeriesSpec, loadTimeSeriesData } from './timeSeries';
  // import { determineTrend, findDateRow, findMaxRow, findMinRow } from './trend';
  import { isMobileDevice } from '../../stores';
  import { formatDateShortOrdinal } from '../../formats';
  import { formatSampleSize, formatStdErr } from './format';
  import SurveyValue from './SurveyValue.svelte';
  // import SurveyTooltip from './SurveyTooltip.svelte';
  import ShapeIcon from '../../components/ShapeIcon.svelte';
  import TrendIndicator from '../mobile/TrendIndicator.svelte';
  import SensorUnit from '../mobile/SensorUnit.svelte';
  import TrendTextSummary from '../mobile/TrendTextSummary.svelte';

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

  // $: data = loadTimeSeriesData(question, region, date);
  // $: spec = createTimeSeriesSpec(params);

  // let loading = true;
  // let noData = false;
  // let maxDate = null;
  // let refDate = null;

  // async function deriveData(dataPromise, date) {
  //   loading = true;
  //   noData = false;
  //   const data = (await dataPromise) || [];
  //   loading = false;
  //   noData = data.length === 0;
  //   const dateRow = findDateRow(date, data);
  //   const trend = determineTrend(date, data, dateRow);
  //   const max = question.inverted ? findMinRow(data) : findMaxRow(data);
  //   maxDate = max ? max.date_value : null;
  //   refDate = trend.refDate;

  //   return {
  //     data,
  //     row: dateRow,
  //     trend,
  //     max,
  //   };
  // }

  // $: summary = deriveData(data, date);

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
    <!-- <Vega
      {spec}
      {data}
      scrollSpy={100}
      signals={{ currentDate: date, maxDate, refDate }}
      tooltip={SurveyTooltip}
      tooltipProps={{ question, sensor }} /> -->
    <div class="uk-text-center uk-text-italic chart-details">
      {#await dateRow then s}
        {s ? `based on ${formatSampleSize(s)} survey responses with a standard error of ${formatStdErr(s.stderr)}` : ''}
      {/await}
    </div>

    <div class="mobile-two-col">
      <div class="mobile-kpi">
        <h3>
          <ShapeIcon shape="circle" color="#c00" />
          Selected
          {#if !$isMobileDevice}count{/if}
        </h3>
        <div>
          {#await trend}
            <SurveyValue value={null} />
          {:then d}
            <SurveyValue value={d && d.current ? d.current.value : null} digits={sensor.isPercentage ? 2 : 1} />
          {/await}
        </div>
        <div class="sub">
          <SensorUnit {sensor} long />
        </div>
        <div>
          <span class="inline-svg-icon">{@html calendarIcon}</span>{formatDateShortOrdinal(date.value)}
        </div>
      </div>
      <div class="mobile-kpi">
        <h3>
          <ShapeIcon shape="diamond" color="gray" />
          {sensor.isInverted ? 'Lowest' : 'Highest'}
          {#if !$isMobileDevice}count{/if}
        </h3>
        <div>
          {#await trend}
            <SurveyValue value={null} />
          {:then d}
            <SurveyValue value={d && d.worst ? d.worst.value : null} digits={sensor.isPercentage ? 2 : 1} />
          {/await}
        </div>
        <div class="sub">
          <SensorUnit {sensor} long />
        </div>
        <div>
          <span class="inline-svg-icon">{@html calendarIcon}</span>
          {#await trend}{formatDateShortOrdinal(null)}{:then d}{formatDateShortOrdinal(d.worstDate)}{/await}
        </div>
      </div>
    </div>

    <p>Compared to the previous week that means:</p>

    <div>
      {#await trend}
        <TrendIndicator trend={null} long {sensor} />
      {:then d}
        <TrendIndicator trend={d} long {sensor} />
      {/await}
    </div>

    <TrendTextSummary {sensor} {date} {trend} />
  </div>
</article>
