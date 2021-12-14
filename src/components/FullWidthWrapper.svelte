<script>
  export let breakOut = false;

  function toggleBreakOut() {
    breakOut = !breakOut;
  }
</script>

<div class="chart-breakout-wrapper">
  <div class="chart-breakout-container" class:chart-breakout={breakOut}>
    <slot />
    <button
      class="uk-icon-button absolutePos"
      class:uk-active={breakOut}
      type="button"
      uk-icon={breakOut ? 'shrink' : 'expand'}
      on:click={toggleBreakOut}
    />
  </div>
</div>

<style>
  .absolutePos {
    position: absolute;
    right: 0;
    top: 2px;
    z-index: 1;
  }
</style>
