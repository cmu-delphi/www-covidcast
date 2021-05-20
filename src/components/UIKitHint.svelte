<script>
  import infoCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/info-circle.svg';
  import warningIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';

  export let title = '';
  export let pos = 'right';
  export let inline = false;
  export let warning = false;
  export let color = 'inherit';
  export let className = '';
  export let noMargin = false;
</script>

<span
  uk-tooltip="title: {title}; pos: {pos}"
  class="title inline-svg-icon {className}"
  class:inline
  class:noMargin
  style="color: {color}"
>
  {@html warning ? warningIcon : infoCircleIcon}
</span>

<style>
  .title {
    width: 12px;
    padding: 0;
    margin-left: 5px;
    flex: 0 0 auto;
  }

  .inline {
    margin-left: 0;
    margin-right: 5px;
  }

  .noMargin {
    margin-left: 0;
    margin-right: 0;
    transform: translate(0, -2px);
  }
</style>
