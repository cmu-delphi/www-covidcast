<script>
  import { currentDateObject, currentRegionInfo, times, getScrollToAnchor } from '../../stores';
  import { questionCategories, visibleLevels, refSensor, questions } from '../../stores/questions';
  import SurveyQuestion from './SurveyQuestion.svelte';
  import SurveyParameters from './SurveyParameters.svelte';
  import Overview from './Overview.svelte';
  import { nationInfo, nameInfos, getStateOfCounty } from '../../maps';
  import MobileSurveyToc from './MobileSurveyToc.svelte';
  import { DataFetcher, DateParam, RegionParam, SensorParam } from '../../stores/params';
  import getRelatedCounties from '../../maps/related';
  import '../mobile/common.css';
  import { modeByID } from '..';
  import { scrollIntoView } from '../../util';

  $: sensor = new SensorParam(refSensor);
  $: date = new DateParam($currentDateObject, refSensor, $times);
  $: region = new RegionParam($currentRegionInfo);

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);

    const sensors = questions.map((d) => d.sensorParam);
    // prefetch all data that is likely needed
    // itself
    const loaded = fetcher.fetchNSensor1RegionNDates(sensors, region, date.windowTimeFrame);
    // fetch self details (sample size)
    fetcher.fetchNSensor1Region1DateDetails(sensors, region, date);

    if (region.level !== 'nation') {
      // nation
      fetcher.fetchNSensor1RegionNDates(sensors, nationInfo, date.windowTimeFrame);
    }
    if (region.level === 'county') {
      // state
      fetcher.fetchNSensor1RegionNDates(sensors, getStateOfCounty(region.value), date.windowTimeFrame);
      // related regions
      fetcher.fetchNSensorNRegionNDates(sensors, getRelatedCounties(region.value), date.windowTimeFrame);
    }

    Promise.all(loaded).then(() => {
      scrollIntoView(getScrollToAnchor(modeByID['survey-results']));
    });
  }

  const filteredInfos = nameInfos.filter((d) => visibleLevels.includes(d.level));
  filteredInfos.unshift(nationInfo);
</script>

<div class="root">
  <SurveyParameters sensor={refSensor} items={filteredInfos} defaultItem={nationInfo}>
    <div class="grid-3-11 mobile-header-line" slot="title">
      <h2>Delphi Survey <span>Results</span></h2>
    </div>
    <MobileSurveyToc>
      {#each questionCategories as cat, i}
        <li class="nav-dropdown-parent">
          <a href="#{cat.anchor}" data-uk-scroll>{i + 1}. {cat.name}</a>
        </li>
      {/each}
    </MobileSurveyToc>
  </SurveyParameters>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <Overview />
    </div>
    <div class="grid-1-3">
      <div class="toc-container uk-visible@m">
        <div class="toc">
          <h5>Survey questions</h5>
          <ol uk-scrollspy-nav="closest: li; scroll: true;" class="uk-nav uk-nav-default">
            {#each questionCategories as cat (cat.name)}
              <li><a href="#{cat.anchor}">{cat.name}</a></li>
            {/each}
          </ol>
        </div>
      </div>
    </div>
    <div class="grid-3-11 questions">
      {#each questionCategories as cat (cat.name)}
        {#each cat.questions as question, i}
          <SurveyQuestion {question} {region} {date} {fetcher} anchor={i === 0 ? cat.anchor : null} />
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    font-size: 0.875rem;
    line-height: 1.5rem;
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
