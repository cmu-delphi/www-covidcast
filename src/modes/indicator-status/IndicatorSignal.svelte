<script>
  import { currentRegionInfo, currentSensor, currentMode, metaDataManager, selectByInfo } from '../../stores';
  import { DEFAULT_SENSOR } from '../../stores/constants';
  import AboutSection from '../../components/AboutSection.svelte';
  import SensorSearch from '../../components/SensorSearch.svelte';
  import RegionSearch from '../../components/RegionSearch.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import IndicatorBackfill from './IndicatorBackfill.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import DataAnomalies from './DataAnomalies.svelte';
  import IndicatorData from './IndicatorData.svelte';
  import { formatDateISO } from '../../formats';
  import KPI from '../../components/KPI.svelte';
  import { toLagToToday } from './data';
  import SensorBadges from '../../components/SensorBadges.svelte';
  import GeoLevelBadge from '../../components/GeoLevelBadge.svelte';
  import SourceBadges from '../../components/SourceBadges.svelte';
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { modeByID } from '..';

  $: sensor = $metaDataManager.getSensor($currentSensor) || $metaDataManager.getSensor(DEFAULT_SENSOR);
  $: source = sensor ? $metaDataManager.getSource(sensor) : undefined;

  function setSensor(d) {
    currentSensor.set(d.key);
  }
  $: metaData = $metaDataManager.getMetaData(sensor);
  $: name = sensor ? sensor.name : 'Signal';

  function switchMode() {
    currentMode.set(modeByID['indicator-source']);
  }
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <button class="mobile-back inline-svg-icon" on:click={switchMode}>
        {@html chevronLeftIcon}
      </button>
      <h2>Indicator Status of <span>{name}</span></h2>
    </div>
    <div class="uk-container content-grid">
      <SensorSearch
        className="grid-3-7"
        modern
        items={$metaDataManager.metaSensors}
        selectedItem={sensor}
        on:change={(e) => setSensor(e.detail)}
      />
      <RegionSearch
        className="grid-7-11"
        modern
        items={[nationInfo, ...stateInfo, ...countyInfo]}
        selectedItem={$currentRegionInfo || nationInfo}
        on:change={(e) => selectByInfo(e.detail && e.detail.level === 'nation' ? null : e.detail)}
      />
    </div>
  </div>
  <div class="uk-container content-grid">
    <AboutSection className="uk-margin-small-top uk-margin-small-bottom">
      <h3 class="mobile-h3">About {name}</h3>
      {#if sensor}
        <div>
          <SensorBadges {sensor} />
        </div>
        <p>
          {@html sensor.description}
        </p>
        {#if sensor.meta.link.length > 0}
          <p>See also:</p>
          <ul>
            {#each sensor.meta.link as link}
              <li>
                <a href={link.href}>{link.alt}</a>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </AboutSection>
    <AboutSection className="uk-margin-small-top uk-margin-small-bottom">
      <h3 class="mobile-h3">Provided by {source ? source.name : ''}</h3>
      {#if source}
        <div>
          <SourceBadges {source} />
        </div>
        <div class="desc">
          {@html source.description}
        </div>
        {#if source.link.length > 0}
          <p>See also:</p>
          <ul>
            {#each source.link as link}
              <li>
                <a href={link.href}>{link.alt}</a>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </AboutSection>
    <div class="grid-3-11">
      <hr />
      <FancyHeader sub="Facts">{name}</FancyHeader>
      <div class="mobile-two-col">
        <div>
          <div>
            <SensorBadges {sensor} />
          </div>
          <div class="sub">Tags</div>
        </div>
        <div>
          <div>
            {#each $metaDataManager.getLevels(sensor) as level}
              <GeoLevelBadge {level} />{' '}
            {/each}
          </div>
          <div class="sub">Geographic Levels</div>
        </div>
        <div>
          <div>
            <KPI text={formatDateISO(metaData ? metaData.minTime : null)} />
          </div>
          <div class="sub">First Data Available</div>
        </div>
        <div>
          <div>
            <KPI text={formatDateISO(metaData ? metaData.maxTime : null)} />
          </div>
          <div class="sub" title="Most recent date for which data is available">Latest Data Available</div>
        </div>
        <div>
          <div>
            <KPI text="{toLagToToday(metaData)} days" />
          </div>
          <div class="sub">Lag to Today</div>
        </div>
        <div class="mobile-kpi">
          <div>
            <KPI text={formatDateISO(metaData ? metaData.maxIssue : null)} />
          </div>
          <div class="sub" title="Date the most recent update was published by Delphi">Latest Issue</div>
        </div>
      </div>
    </div>
    <div class="grid-3-11 uk-margin-medium-top">
      <hr />
      <FancyHeader sub="Backfill Profile">{name}</FancyHeader>
    </div>
    <IndicatorBackfill {sensor} region={$currentRegionInfo} />
    <div class="grid-3-11 uk-margin-medium-top">
      <hr />
      <FancyHeader sub="Data Anomalies">{name}</FancyHeader>
      <AboutSection details className="uk-margin-small-top uk-margin-small-bottom">
        <h3 slot="header" class="mobile-h3">About Data Anomalies</h3>
        <div class="desc">
          One of the most surprising challenges identified during the COVID-19 pandemic is how messy public health data
          streams are, no matter how hard people try to keep them clean. The best we can do is be transparent about when
          something has gone wrong, what data is affected and how, and what repairs have been made after the discovery
          of a data anomaly. This section catalogues all such anomalies we have identified so far. If you encounter a
          data anomaly not listed here, please report it by <a
            href="https://github.com/cmu-delphi/covidcast-indicators/issues/new?labels=data+quality&template=data_quality_issue.md&title="
            >(opening a data quality issue on our GitHub)</a
          >.
        </div>
      </AboutSection>
      <DataAnomalies {sensor} region={$currentRegionInfo || nationInfo} />
    </div>
    <div class="grid-3-11 uk-margin-medium-top">
      <hr />
      <FancyHeader sub="Data">{name}</FancyHeader>
      <AboutSection details className="uk-margin-small-top uk-margin-small-bottom">
        <h3 slot="header" class="mobile-h3">About Data Versioning</h3>
        <div class="desc">
          The data versioning view permits browsing this time series as it appeared at any available date in the past.
          This provides an alternative perspective on how backfill affects this time series.
        </div>
      </AboutSection>
    </div>
    <IndicatorData {sensor} region={$currentRegionInfo || nationInfo} />
  </div>
</div>
