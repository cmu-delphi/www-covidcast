<script>
  import { onMount } from 'svelte';
  import { formatDateLocal } from '../../formats';
  import HistoryLineChart from '../../blocks/HistoryLineChart.svelte';
  import { metaDataManager } from '../../stores';
  import { SensorParam } from '../../stores/params';
  /**
   * @type {import('../../stores/questions').Revision}
   */
  export let revision;

  export let open = false;
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  $: sensor = new SensorParam(revision.sensor, $metaDataManager);

  /**
   * @type {HTMLElement | null}
   */
  let el = null;
  onMount(() => {
    const l = () => {
      open = el.open;
    };
    el.addEventListener('toggle', l);
    return () => {
      el.removeEventListener('toggle', l);
    };
  });
</script>

<details bind:this={el} bind:open>
  <summary>
    <h4>
      {revision.addedInWave.name} ({formatDateLocal(revision.addedInWave.published)}) - {revision.changedInWave.name} ({formatDateLocal(
        revision.changedInWave.published,
      )})
    </h4>
  </summary>
  <p>
    {@html revision.change}

    Details are described in the <a href={revision.changedInWave.link}>{revision.changedInWave.name}</a> revision log.
  </p>
  {#if open}
    <div class="chart-300">
      <HistoryLineChart
        {sensor}
        {date}
        {region}
        {fetcher}
        starts={revision.addedInWave.published}
        ends={revision.changedInWave.published}
      />
    </div>
  {/if}
</details>

<style>
  h4 {
    display: inline-block;
    margin: 0;
    cursor: pointer;
    font-size: 0.875rem;
  }

  @media only screen and (min-width: 1050px) {
    h4 {
      font-size: 1.25rem;
    }
  }
</style>
