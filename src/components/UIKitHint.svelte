<script>
  import infoCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/info-circle.svg';

  export let title = '';
  export let pos = 'right';
  export let inline = false;
</script>

<span uk-tooltip="title: {title}; pos: {pos}" class="title inline-svg-icon" class:inline>
  {@html infoCircleIcon}
</span>

<style>
  .title {
    color: inherit;
    width: 12px;
    padding: 0;
    margin-left: 5px;
    flex: 0 0 auto;
  }

  .inline {
    margin-left: 0;
    margin-right: 5px;
  }
</style>
