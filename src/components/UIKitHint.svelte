<script>
  import infoCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/info-circle.svg';

  export let title = '';
  export let pos = 'right';
</script>

<span uk-tooltip="title: {title}; pos: {pos}" class="title inline-svg-icon">
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
</style>
