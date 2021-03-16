<script>
  import { onMount } from 'svelte';
import { formatDateLocal } from '../../formats';
  import HistoryLineChart from '../mobile/HistoryLineChart.svelte';
  /**
   * @type {import('./questions').Revision}
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
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  $: sensor = revision.sensorParam;

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
      {revision.addedInWave.name} ({formatDateLocal(revision.addedInWave.published)}) - {revision.changedInWave.name} ({formatDateLocal(revision.changedInWave.published)})
    </h4>
  </summary>
  <p>
    {@html revision.change}

    Details are described in the <a href={revision.changedInWave.link}>Wave {revision.changedInWave.name}</a> revision
    log.
  </p>
  {#if open}
    <div class="chart-300">
      <HistoryLineChart {sensor} {date} {region} {fetcher} />
    </div>
  {/if}
</details>

<style>
  h4 {
    display: inline-block;
    margin: 0;
    cursor: pointer;
  }
</style>
