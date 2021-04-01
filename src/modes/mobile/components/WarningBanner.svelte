<script>
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
</script>

<div class="uk-alert no-data">
  <span class="inline-svg-icon">
    {@html warningIcon}
  </span>
  <slot />
</div>

<style>
  .no-data {
    letter-spacing: 0.75px;
    text-transform: uppercase;
    color: #ffffff;
    background: #f2994a;
    border-radius: 3px;
  }
</style>
