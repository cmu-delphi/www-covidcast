<script>
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
  import { formatDateISO } from '../../formats';

  export let className = '';
  export let annotation;
</script>

<div class="uk-alert uk-alert-warning {className}">
  <h5 class="alert-header">
    <div class="text">
      <span class="inline-svg-icon">
        {@html warningIcon}
      </span>
      {annotation.problem}
    </div>
    <div class="date">{formatDateISO(annotation.dates[0])} - {formatDateISO(annotation.dates[1])}</div>
  </h5>
  <p>
    {annotation.explanation}
  </p>
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
</style>
