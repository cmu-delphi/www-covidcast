<script>
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  import infoIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/info-circle.svg';
  import { formatDateISO } from '../formats';

  export let className = '';
  export let annotation;
</script>

<div class="uk-alert uk-alert-{annotation.uncertainty || annotation.isAllTime ? 'info' : 'warning'} {className}">
  <h5 class="alert-header">
    <div class="text">
      <span class="inline-svg-icon">
        {#if annotation.uncertainty}
          {@html infoIcon}
        {:else}
          {@html warningIcon}
        {/if}
      </span>
      {annotation.problem}
    </div>
    {#if !annotation.isAllTime}
      <div class="date">{formatDateISO(annotation.dates[0])} - {formatDateISO(annotation.dates[1])}</div>
    {/if}
  </h5>
  <p class="uk-margin-remove-bottom">
    {annotation.explanation}
  </p>
  <div class="alert-source">
    {#if annotation.reference}
      <a href={annotation.reference}>Source</a>
    {/if}
  </div>
</div>

<style>
  .uk-alert-warning {
    color: #d46b08;
  }
  .alert-header {
    font-weight: 600;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    white-space: nowrap;
  }

  .text {
    flex-grow: 1;
  }

  @media only screen and (max-width: 767px) {
    .alert-header {
      display: block;
      text-align: center;
    }
  }

  .alert-source {
    font-size: 0.875rem;
    text-align: right;
  }
</style>
