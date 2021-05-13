<script>
  import FancyHeader from '../../components/FancyHeader.svelte';
  import IndicatorRevision from './IndicatorRevision.svelte';

  /**
   * @type {import('../../stores/questions').Question}
   */
  export let question;
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
</script>

<FancyHeader sub="Revisions">Previous</FancyHeader>
{#each question.oldRevisions as revision}
  <IndicatorRevision {revision} {date} {region} {fetcher} />
{/each}
