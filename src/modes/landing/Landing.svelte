<script>
  import Search from '../../components/Search.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../maps';
  import { currentMode, currentRegionInfo, groupedSensorList, recentRegionInfos, selectByInfo } from '../../stores';
  import flagUSAIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/flag-usa.svg';
  import { modeByID } from '..';
  import { questions } from '../survey/questions';
  import '../mobile/common.css';
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import SurveyStats from '../survey/SurveyStats.svelte';

  function switchMode(region) {
    if (region !== undefined) {
      selectByInfo(region);
    }
    currentMode.set(modeByID.overview);
  }
  /**
   * @param {import('../../maps').NameInfo} d
   */
  function combineKeywords(d) {
    return `${d.id} ${d.displayName}`;
  }

  function switchDashboard() {
    currentMode.set(modeByID['survey-results']);
  }
</script>

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
    text-align: center;
    font-weight: normal;
  }

  .button-wrapper {
    margin-top: 0.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: 600;
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

  .link-link {
    font-size: 0.75rem;
    display: block;
    text-align: center;
    margin-top: 0.5em;
    text-decoration: underline;
  }
</style>

<div class="uk-container content-grid root mobile-root landing-banner">
  <div class="grid-4-10">
    <h2>Welcome to COVIDcast</h2>
    <p>Explore COVID-19 indicators nearby</p>

    <Search
      modern="small"
      placeholder="Search for state or county"
      items={[nationInfo, ...stateInfo, ...countyInfo]}
      selectedItem={$currentRegionInfo}
      labelFieldName="displayName"
      keywordFunction={combineKeywords}
      maxItemsToShowInList="5"
      on:change={(e) => switchMode(e.detail && e.detail.level === 'nation' ? null : e.detail)} />

    <div class="chips">
      {#each $recentRegionInfos.slice(0, 3) as region}
        <a
          class="chip uk-link-text uk-link-toggle"
          href="?mode=mobile&region={region.propertyId}"
          on:click|preventDefault={() => switchMode(region)}>
          {region.displayName}
        </a>
      {/each}
    </div>
    <div class="button-wrapper">
      <a
        class="uk-button uk-button-default uk-button-delphi uk-button-delphi__secondary uk-text-uppercase"
        href="?mode=mobile"
        on:click|preventDefault={() => switchMode(null)}>
        <span class="inline-svg-icon">
          {@html flagUSAIcon}
        </span>
        National Overview
      </a>
    </div>

    <p>
      COVIDcast provides real-time county-level indicators in the United States. Our indicators include our national
      COVID survey, public experience, attitude, behavior, doctor's visits, hospital admissions, tests, cases and
      deaths.
    </p>

    <FancyHeader sub="stats" center>Indicator</FancyHeader>
    <a href="https://cmu-delphi.github.io/delphi-epidata/" class="link-link uk-link-text">Explore our API</a>

    <div class="mobile-two-col uk-text-center mobile-two-col__highlight">
      <div class="mobile-kpi">
        <div>
          <SurveyValue value={questions.length} digits={0} />
        </div>
        <div class="subheader">Survey Indicators</div>
      </div>
      {#each groupedSensorList as group}
        <div class="mobile-kpi">
          <div>
            <SurveyValue value={group.sensors.length} digits={0} />
          </div>
          <div class="subheader">{group.label}{group.label.endsWith('Indicators') ? '' : ' Indicators'}</div>
        </div>
      {/each}
    </div>

    <FancyHeader sub="Audience" center>Survey</FancyHeader>
    <a href="?mode=survey-results" on:click|preventDefault={switchDashboard} class="link-link uk-link-text">Go to survey
      dashboard</a>

    <SurveyStats className="uk-text-center mobile-two-col__highlight" />

    <p>In collaboration with Facebook, Google, Change Healthcare, and Quidel.</p>
  </div>
</div>
