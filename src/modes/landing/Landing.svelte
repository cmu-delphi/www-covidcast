<script>
  import Search from '../../components/Search.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import { currentRegionInfo, groupedSensorList, recentRegionInfos, selectByInfo, switchToMode } from '../../stores';
  import flagUSAIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/flag-usa.svg';
  import { modeByID } from '..';
  import { questionCategories } from '../../stores/questions';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import SurveyStats from '../../blocks/SurveyStats.svelte';
  import SensorGroup from './SensorGroup.svelte';

  function switchMode(region) {
    if (region !== undefined) {
      selectByInfo(region);
    }
    switchToMode(modeByID.summary);
  }
  /**
   * @param {import('../../data/regions').NameInfo} d
   */
  function combineKeywords(d) {
    return `${d.id} ${d.displayName}`;
  }

  function switchSurvey() {
    switchToMode(modeByID['survey-results']);
  }
  function switchCorrelations() {
    switchToMode(modeByID.correlation);
  }
</script>

<div class="uk-container content-grid root mobile-root landing-banner">
  <div class="grid-4-10">
    <h2>Welcome to COVIDcast</h2>
    <p>Explore real-time COVID-19 indicators in any county, state or across the U.S.</p>

    <Search
      modern="small"
      placeholder="Search for state or county"
      title="Region"
      items={[nationInfo, ...stateInfo, ...countyInfo]}
      selectedItem={$currentRegionInfo}
      labelFieldName="displayName"
      keywordFunction={combineKeywords}
      maxItemsToShowInList={5}
      on:change={(e) => switchMode(e.detail && e.detail.level === 'nation' ? null : e.detail)}
    />

    <div class="chips">
      {#each $recentRegionInfos.slice(0, 3) as region}
        <a
          class="chip uk-link-text uk-link-toggle"
          href="./{modeByID.summary.id}?region={region.propertyId}"
          on:click|preventDefault={() => switchMode(region)}
        >
          {region.displayName}
        </a>
      {/each}
    </div>
    <div class="button-wrapper">
      <a
        class="uk-button uk-button-default uk-button-delphi uk-button-delphi__secondary uk-text-uppercase"
        href="./{modeByID.summary.id}"
        on:click|preventDefault={() => switchMode(null)}
      >
        <span class="inline-svg-icon">
          {@html flagUSAIcon}
        </span>
        U.S. National Summary
      </a>
    </div>

    <div class="block">
      <hr />
      <FancyHeader sub="Indicators" center>COVID-19</FancyHeader>
      <p>
        COVIDcast gathers data from dozens of sources and produces a set of indicators which can inform our reasoning
        about the pandemic. Indicators are produced from these raw data by extracting a metric of interest, tracking
        revisions, and applying additional processing like reducing noise, adjusting temporal focus, or enabling more
        direct comparisons.
      </p>

      <ul class="sensors">
        {#each groupedSensorList as group}
          <SensorGroup {group} />
        {/each}
      </ul>
      <p>
        Our most useful indicators are visualized in this site, but for the full set, please <a
          href="https://cmu-delphi.github.io/delphi-epidata/">visit our API</a
        >.
      </p>
      <div class="button-wrapper">
        <a class="uk-button uk-button-default uk-button-delphi" href="https://cmu-delphi.github.io/delphi-epidata/">
          COVIDcast API
        </a>
      </div>
    </div>

    <div class="block">
      <hr />
      <FancyHeader sub="Correlations" center>Indicator</FancyHeader>
      <p>
        Correlation doesn’t equal causation, but understanding how indicators move together can tell a deeper story than
        individual indicators by themselves.
      </p>
      <p>
        Explore the relationship between indicators as their values change over time. Discover which indicators
        correlate most strongly in a specific location, and see which of those may have some predictive power.
      </p>
      <div class="button-wrapper">
        <a
          class="uk-button uk-button-default uk-button-delphi uk-text-uppercase"
          href="./{modeByID.correlation.id}"
          on:click|preventDefault={switchCorrelations}
        >
          Explore Correlations
        </a>
      </div>
    </div>

    <div class="block">
      <hr />
      <FancyHeader sub="Pandemic Survey via Facebook" center>Delphi</FancyHeader>
      <p>
        The U.S. Pandemic Survey offers insights into public sentiment on:
        <a href="./{modeByID['survey-results'].id}" on:click|preventDefault={switchSurvey}>
          {#each questionCategories as cat, i}
            {i === questionCategories.length - 1 ? ' and' : i > 0 ? ',' : ''}
            {cat.name}
          {/each}
        </a>
      </p>

      <div class="button-wrapper">
        <a
          class="uk-button uk-button-default uk-button-delphi uk-text-uppercase"
          href="./{modeByID['survey-results'].id}"
          on:click|preventDefault={switchSurvey}
        >
          View Survey Results
        </a>
      </div>

      <SurveyStats className="uk-text-center mobile-two-col__highlight" />
    </div>

    <p>In collaboration with Facebook, Google.org, Change Healthcare, and Quidel.</p>
  </div>
</div>

<style>
  .landing-banner {
    background: url('../../assets/imgs/landing-banner.png');
    background-position: top left;
    background-size: 100% 20px;
    background-repeat: no-repeat;
    margin-top: 0;
    padding-top: 40px;
  }

  h2 {
    margin-top: 2.75rem;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
  }

  p {
    margin: 1.5rem 0;
    font-size: 0.875rem;
    font-weight: normal;
    text-align: justify;
  }

  ul.sensors > :global(li) {
    padding: 0.25em 0;
  }

  .button-wrapper {
    margin-top: 0.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: 600;
  }

  .block {
    margin: 3em 0 1em 0;
  }

  @media only screen and (max-width: 1050px) {
    h2 {
      font-size: 2rem;
    }
    .button-wrapper {
      align-items: stretch;
    }
  }
  @media only screen and (max-width: 400px) {
    h2 {
      font-size: 1.5rem;
    }
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    margin: 1em 0;
    justify-content: center;
  }
  .chips:empty {
    margin: 0;
  }
  .chip {
    border-radius: 17px;
    padding: 4px 12px;
    background: #f0f1f3;
    margin: 0.25em 2px;
  }
  .chip:hover,
  .chip:focus {
    background: #eee;
  }
</style>
