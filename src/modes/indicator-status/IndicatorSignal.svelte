<script>
  import { currentRegionInfo, currentSensor, metaDataManager, selectByInfo } from '../../stores';
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

  $: sensor = $metaDataManager.getSensor($currentSensor) || $metaDataManager.getSensor(DEFAULT_SENSOR);
  function setSensor(d) {
    currentSensor.set(d.key);
  }
  $: metaData = $metaDataManager.getMetaData(sensor);
  $: name = sensor ? sensor.name : 'Signal';
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
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
      <div class="desc">Name, API Name, Description, Link to API Docs</div>
    </AboutSection>
    <AboutSection className="uk-margin-small-top uk-margin-small-bottom">
      <h3 class="mobile-h3">About {sensor ? sensor.dataSourceName : ''}</h3>
      <div class="desc">Name, API Name, Description, Link to API Docs</div>
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
          <div class="sub">Latest Data Available</div>
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
          <div class="sub">Latest Issue</div>
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
        <div class="desc">TODO</div>
      </AboutSection>
      <DataAnomalies {sensor} region={$currentRegionInfo || nationInfo} />
    </div>
    <div class="grid-3-11 uk-margin-medium-top">
      <hr />
      <FancyHeader sub="Data">{name}</FancyHeader>
      <AboutSection details className="uk-margin-small-top uk-margin-small-bottom">
        <h3 slot="header" class="mobile-h3">About Data Versioning</h3>
        <div class="desc">TODO</div>
      </AboutSection>
    </div>
    <IndicatorData {sensor} region={$currentRegionInfo || nationInfo} />
  </div>
</div>