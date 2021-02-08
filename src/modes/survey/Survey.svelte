<script>
  import { currentRegionInfo, smallMultipleTimeSpan, currentDateObject } from '../../stores';
  import { questionCategories, visibleLevels, refSensor } from './questions';
  import SurveyQuestion from './SurveyQuestion.svelte';
  import SurveyParameters from './SurveyParameters.svelte';
  import Overview from './Overview.svelte';
  import { nationInfo, nameInfos } from '../../maps';
  import MobileSurveyToc from './MobileSurveyToc.svelte';
  // use local variables with manual setting for better value comparison updates
  let startDay = $smallMultipleTimeSpan[0];
  let endDay = $smallMultipleTimeSpan[1];

  $: {
    if (startDay.getTime() !== $smallMultipleTimeSpan[0].getTime()) {
      startDay = $smallMultipleTimeSpan[0];
    }
    if (endDay.getTime() !== $smallMultipleTimeSpan[1].getTime()) {
      endDay = $smallMultipleTimeSpan[1];
    }
  }
  $: params = { region: $currentRegionInfo || nationInfo, startDay, endDay };

  const filteredInfos = nameInfos.filter((d) => visibleLevels.includes(d.level));
  filteredInfos.unshift(nationInfo);
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    overflow: auto;
  }
  .questions {
    margin-top: 1em;
  }
  .toc-container {
    position: sticky;
    top: 100px;
    margin-top: 1em;
  }

  .content-grid {
    grid-row-gap: 0;
  }

  .toc {
    padding: 24px 6px 24px 24px;
  }
</style>

<div class="root">
  <SurveyParameters sensor={refSensor} items={filteredInfos} defaultItem={nationInfo}>
    <MobileSurveyToc />
  </SurveyParameters>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <Overview />
      <h2>Results</h2>
    </div>
    <div class="grid-1-3">
      <div class="toc-container uk-visible@m">
        <div class="toc">
          <h5>Survey questions</h5>
          <ol uk-scrollspy-nav="closest: li; scroll: true; offset: 100" class="uk-nav uk-nav-default">
            {#each questionCategories as cat}
              <li><a href="#{cat.anchor}">{cat.name}</a></li>
            {/each}
          </ol>
        </div>
      </div>
    </div>
    <div class="grid-3-11 questions">
      {#each questionCategories as cat}
        <!-- svelte-ignore a11y-missing-content -->
        <a id={cat.anchor} />
        {#each cat.questions as question}
          <SurveyQuestion {question} date={$currentDateObject} {params} />
        {/each}
      {/each}
    </div>
  </div>
</div>
