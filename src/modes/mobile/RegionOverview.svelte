<script>
  import { formatPopulation } from '../../formats';
  import { getCountiesOfState } from '../../maps';
  import FancyHeader from './FancyHeader.svelte';

  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
</script>

{#if region.level === 'state'}
  <FancyHeader normal>{region.value.displayName} state meta data</FancyHeader>
  <div class="mobile-two-col">
    <div>
      <h3>State population</h3>
      <div>{formatPopulation(region)}</div>
    </div>
    <div>
      <h3>Counties</h3>
      <div>{getCountiesOfState(region.value).length}</div>
    </div>
    <div>
      <h3>Hospitals</h3>
      <div>?</div>
    </div>
    <div>
      <h3>Largest County</h3>
      <div>
        {getCountiesOfState(region.value).reduce((acc, v) => (acc === null || acc.population < v.population ? v : acc), null).displayName}
      </div>
    </div>
  </div>
{:else if region.level === 'county'}
  <FancyHeader normal>{region.value.displayName} meta data</FancyHeader>
  <div class="mobile-two-col">
    <div>
      <h3>County population</h3>
      <div>{formatPopulation(region)}</div>
    </div>
  </div>
{/if}
