<script>
  import Vega from '../../components/Vega.svelte';

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
  $: {
    loading = true;
    if (data) {
      data.then(() => {
        loading = false;
      });
    }
  }
</script>

<style>
  .body > :global(.vega-embed) {
    display: block;
  }
</style>

<article class:loading class="uk-card uk-card-default">
  <div class="uk-card-header">
    <a id={question.name}><span class="uk-hidden">{question.name}</span></a>
    <h3 class="uk-card-title">{question.name}</h3>
  </div>
  <div class="uk-card-body body">
    <p>{question.question}</p>
    <Vega {spec} {data} signals={{ currentDate: date, maxDate: null }} />
  </div>
  <div class="uk-card-footer" />
</article>
