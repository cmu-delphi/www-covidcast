<script>
  import Search from '../../components/Search.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../maps';
  import { currentMode, currentRegionInfo, groupedSensorList, recentRegionInfos, selectByInfo } from '../../stores';
  import flagUSAIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/flag-usa.svg';
  import { modeByID } from '..';
  import { questions } from '../survey/questions';

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

  .button-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  @media only screen and (max-width: 715px) {
    .button-wrapper {
      align-items: stretch;
    }
  }

  .highlights {
    vertical-align: bottom;
  }

  .highlights th {
    text-align: right;
    padding: 0.5em 1em;
  }

  .highlights h3 {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.5rem;
    margin: 0;
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

<div class="uk-container content-grid root">
  <div class="grid-3-11">
    <h2>Welcome to COVIDcast</h2>
    <p>Explore COVID-19 indicators nearby</p>

    <Search
      modern="small"
      placeholder="Search for state or county"
      items={[nationInfo, ...stateInfo, ...countyInfo]}
      selectedItem={$currentRegionInfo}
      labelFieldName="displayName"
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
        class="uk-button uk-button-default uk-button-delphi"
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

    <table class="highlights">
      <tr>
        <th>
          <h3>{questions.length}</h3>
        </th>
        <td>Survey Indicators</td>
      </tr>
      {#each groupedSensorList as group}
        <tr>
          <th>
            <h3>{group.sensors.length}</h3>
          </th>
          <td>{group.label}{group.label.endsWith('Indicators') ? '' : ' Indicators'}</td>
        </tr>
      {/each}
    </table>

    <p>In collaboration with Facebook, Google, Change Healthcare, and Quidel.</p>
  </div>
</div>
