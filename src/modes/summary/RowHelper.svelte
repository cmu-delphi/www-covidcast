<script>
  import { isMobileDevice } from '../../stores';
</script>

{#if $isMobileDevice}
  <tr class="mobile-table-first">
    <slot name="common" />
    <slot name="header" />
  </tr>
  <tr class="mobile-table-other">
    <slot />
  </tr>
{:else}
  <tr>
    <slot name="common" />
    <slot name="header" />
    <slot />
  </tr>
{/if}
