<script>
  import infoCircleIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/info-circle.svg';

  export let title = '';
  export let pos = 'right';
</script>

<style>
  .title {
    width: 12px;
    padding: 0;
    margin-left: 5px;
  }
</style>

<span uk-tooltip="title: {title}; pos: {pos}" class="title inline-svg-icon">
  {@html infoCircleIcon}
</span>
