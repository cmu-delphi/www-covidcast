<script>
  import Search from '../../components/Search.svelte';
  import { countyInfo, stateInfo } from '../../maps';
  import { currentMode, recentRegionInfos, selectByInfo } from '../../stores';
  import flagUSAIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/flag-usa.svg';
  import arrowRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/arrow-circle-right.svg';
  import { modeByID } from '..';

  function switchMode(region) {
    if (region !== undefined) {
      selectByInfo(region);
    }
    currentMode.set(modeByID.mobile);
  }
</script>

<style>
  .root {
    font-size: 0.875rem;
    line-height: 1.5rem;
  }
  h2 {
    font-size: 0.875rem;
    font-weight: 700;
  }

  .summary-button-bar {
    display: flex;
    justify-content: flex-start;
    text-align: center;
  }

  .summary-button-bar > div {
    flex: 1 1 0;
  }

  .summary-button-bar .uk-button {
    display: block;
    text-transform: center;
  }

  @media only screen and (max-width: 715px) {
    .summary-button-bar {
      display: block;
    }

    .summary-button-bar > div {
      margin-bottom: 0.5em;
    }
  }

  .highlights {
    vertical-align: end;
  }
  .highlights th {
    text-align: right;
    margin-right: 1em;
  }
  .highlights h3 {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    margin: 0.5em 0;
  }
  .chips:empty {
    margin: 0;
  }
  .chip {
    border-radius: 3px;
    border: 1px solid #d3d4d8;
    padding: 2px 0.5em;
    margin: 0 2px;
  }
  .chip:hover,
  .chip:focus {
    background: #eee;
  }
</style>

<div class="uk-container root">
  <h2>Welcome to COVIDcast</h2>
  <p>Explore COVID-19 indicators nearby</p>

  <Search
    modern
    placeholder="Search for state or county"
    items={stateInfo.concat(countyInfo)}
    labelFieldName="displayName"
    maxItemsToShowInList="5"
    on:change={(e) => selectByInfo(e.detail && e.detail.level === 'nation' ? null : e.detail)} />

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
  <div class="summary-button-bar">
    <div>
      <a
        class="uk-button uk-button-default uk-button-delphi"
        href="?mode=mobile"
        on:click|preventDefault={() => switchMode()}>
        <span class="inline-svg-icon">
          {@html arrowRightIcon}
        </span>
        Continue
      </a>
    </div>
    <div>
      <a
        class="uk-button uk-button-default uk-button-delphi"
        href="?mode=mobile"
        on:click|preventDefault={() => switchMode(null)}>
        <span class="inline-svg-icon">
          {@html flagUSAIcon}
        </span>
        View United States
      </a>
    </div>
  </div>

  <p>
    Real-time county level indicators for COVID-19. Our indicators include public experience, attitude, behavior,
    doctors visits, hospital admissions, tests, cases, hospitalizations, and deaths.
  </p>

  <table class="highlights">
    <tr>
      <th>
        <h3>TODO</h3>
      </th>
      <td>Total survey responses</td>
    </tr>
    <tr>
      <th>
        <h3>TODO</h3>
      </th>
      <td>Forecasting Models</td>
    </tr>
    <tr>
      <th>
        <h3>TODO</h3>
      </th>
      <td>Origianl COVID-19 indicators</td>
    </tr>
  </table>

  <p>In collaboration with Facebook, Google, Change Healthcare, and Quidel.</p>
</div>
