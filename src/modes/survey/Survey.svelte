<script>
  import { currentDateObject, currentRegionInfo, times } from '../../stores';
  import { questionCategories, visibleLevels, refSensor, questions } from './questions';
  import SurveyQuestion from './SurveyQuestion.svelte';
  import SurveyParameters from './SurveyParameters.svelte';
  import Overview from './Overview.svelte';
  import { nationInfo, nameInfos, getStateOfCounty } from '../../maps';
  import MobileSurveyToc from './MobileSurveyToc.svelte';
  import { DataFetcher, DateParam, RegionParam, SensorParam } from '../../stores/params';

  $: sensor = new SensorParam(refSensor, $times);
  $: date = new DateParam($currentDateObject, refSensor, $times);
  $: region = new RegionParam($currentRegionInfo);

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);

    // prefetch all data that is likely needed
    // itself
    fetcher.fetchNSensor1RegionNDates(
      questions.map((d) => d.sensorParam),
      region,
      date.windowTimeFrame,
    );
    // fetch self details (sample size)
    fetcher.fetchNSensor1Region1DateDetails(
      questions.map((d) => d.sensorParam),
      region,
      date,
    );

    if (region.level !== 'nation') {
      // nation
      fetcher.fetchNSensor1RegionNDates(
        questions.map((d) => d.sensorParam),
        nationInfo,
        date.windowTimeFrame,
      );
    }
    if (region.level === 'county') {
      // state
      fetcher.fetchNSensor1RegionNDates(
        questions.map((d) => d.sensorParam),
        getStateOfCounty(region.value),
        date.windowTimeFrame,
      );
    }
  }

  const filteredInfos = nameInfos.filter((d) => visibleLevels.includes(d.level));
  filteredInfos.unshift(nationInfo);
</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
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
    <div class="grid-3-11 mobile-header-line" slot="title">
      <h2>Delphi Survey <span>Results</span></h2>
    </div>
    <MobileSurveyToc />
  </SurveyParameters>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <Overview />
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
          <SurveyQuestion {question} {region} {date} {fetcher} />
        {/each}
      {/each}
    </div>
  </div>
</div>
