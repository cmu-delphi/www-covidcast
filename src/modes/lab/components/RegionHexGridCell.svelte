<script>
  import { formatDateShort, formatPopulation } from '../../../formats';
  import childIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/child.svg';
  import calendarIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/calendar.svg';

  import HexGridCell from './HexGridCell.svelte';
  /**
   * @type {import('../mobile/utils').Params}
   */
  export let params;

  export let style = '';
  export let className = '';

  export let x = -1;
  export let y = -1;
</script>

<HexGridCell {x} {y} {style} {className} border="2px" on:click>
  <div class="content">
    <span>
      <span class="inline-svg-icon">
        {@html childIcon}
      </span>
      {formatPopulation(params.region)}
    </span>
    <h3>{params.region.displayName}</h3>
    <span>
      <span class="inline-svg-icon">
        {@html calendarIcon}
      </span>
      {formatDateShort(params.date)}
    </span>
  </div>
</HexGridCell>

<style>
  .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  h3 {
    font-size: 2rem;
    margin: 1em 0.5em;
  }

  span {
    display: flex;
    align-items: center;
  }
</style>
