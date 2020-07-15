<script>
  import { fade } from 'svelte/transition';

  $: tick = 0;
  let timer;
  export function count() {
    tick = 1;
    clearInterval(timer);
    timer = setInterval(() => {
      tick += 1;
    }, 1000);
  }
  $: if (tick >= 5) {
    clearInterval(timer);
  }
</script>

<style>
  .message {
    font-size: 13px;

    text-align: center;
    color: red;
  }
</style>

<div class="message">
  {#if tick >= 1 && tick <= 3}
    <p transition:fade={{ duration: 100 }}>No data available for selected location</p>
  {/if}
</div>
