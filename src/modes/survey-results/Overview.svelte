<script>
  import { overviewText, dataAccessLink, surveyFullTextLink, ctisWarning } from '../../stores/questions';
  import SurveyStats from '../../blocks/SurveyStats.svelte';
</script>

<div class="uk-alert-primary" uk-alert>
  <!-- svelte-ignore a11y-missing-attribute -->
  <!-- svelte-ignore a11y-missing-content -->
  <a class="uk-alert-close" uk-close />
  <p>{@html ctisWarning}</p>
</div>

<SurveyStats />

{@html overviewText}

<div class="summary-button-bar">
  <div>
    <a class="uk-button uk-button-default uk-button-delphi" href={surveyFullTextLink}>See original survey questions</a>
  </div>
  <div><a class="uk-button uk-button-default uk-button-delphi" href={dataAccessLink}>Download aggregate data</a></div>
</div>

<style>
  .summary-button-bar {
    display: flex;
    justify-content: flex-start;
    text-align: center;
  }

  .summary-button-bar > div {
    flex: 1 1 0;
  }

  .summary-button-bar .uk-button {
    display: block;
  }

  @media only screen and (max-width: 715px) {
    .summary-button-bar {
      display: block;
    }

    .summary-button-bar > div {
      margin-bottom: 0.5em;
    }
  }
</style>
