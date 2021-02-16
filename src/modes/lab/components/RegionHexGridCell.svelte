<script>
  import HexGridCell from './HexGridCell.svelte';
  /**
   * @type {import('../mobile/utils').Params}
   */
  export let params;

  export let style = '';
  export let className = '';

  export let x = -1;
  export let y = -1;
  export let border = 0;
</script>

<style>
</style>

<HexGridCell {x} {y} {style} {className} {border} on:>
  <h3>{params.region.displayName}</h3>
</HexGridCell>
