<script>
  import Vega from '../../components/Vega.svelte';
  import UIKitHint from '../../components/UIKitHint.svelte';
  import fileIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/file.svg';
  import linkIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/link.svg';
  import userEditIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/user-edit.svg';

  import { createTimeSeriesSpec, loadTimeSeriesData } from './timeSeries';

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
  $: {
    loading = true;
    noData = false;
    if (data) {
      data.then((r) => {
        noData = r.length === 0;
        loading = false;
      });
    }
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
  }
  .question-question-name {
    font-size: 1.25rem;
    font-style: italic;
  }
  .question-question {
    font-style: italic;
    font-size: 2rem;
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
    <Vega {spec} {data} signals={{ currentDate: date, maxDate: null }} />
  </div>
</article>
