<script>
  export let details = '';
  export let className = '';
</script>

<div class="grid-3-11 mobile-invert {className}">
  {#if details}
    <details>
      <summary>
        <slot name="header">
          {details}
        </slot>
      </summary>
      <slot />
    </details>
  {:else}
    <slot />
  {/if}
</div>

<style>
  details > summary {
    cursor: pointer;
  }

  details > summary > :global(.mobile-h3) {
    display: inline;
    margin-bottom: 4px;
  }

  .mobile-invert {
    background: #f0f1f3;
    border-radius: 3px;
    padding: 1.5rem;
  }
</style>
