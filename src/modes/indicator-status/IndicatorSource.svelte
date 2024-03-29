<script>
  import { currentSensor, metaDataManager, switchToMode } from '../../stores';
  import { DEFAULT_SENSOR, getLevelInfo } from '../../stores/constants';
  import AboutSection from '../../components/AboutSection.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import { formatDateISO, formatWeek } from '../../formats';
  import KPI from '../../components/KPI.svelte';
  import KPIValue from '../../components/KPIValue.svelte';
  import IndicatorCoverageChart from './IndicatorCoverageChart.svelte';
  import IndicatorCountyMap from './IndicatorCountyMap.svelte';
  import IndicatorStateMap from './IndicatorStateMap.svelte';
  import IndicatorSignalTable from './IndicatorSignalTable.svelte';
  import { fetchCoverage, getAvailableCounties, findLatestCoverage, toLagToToday } from './data';
  import { TimeFrame } from '../../data/TimeFrame';
  import { timeDay } from 'd3-time';
  import SensorSourceSearch from '../../components/SensorSourceSearch.svelte';
  import SourceBadges from '../../components/SourceBadges.svelte';
  import { modeByID } from '..';

  $: resolvedSource = $metaDataManager.getSource($currentSensor) || $metaDataManager.getSource(DEFAULT_SENSOR);

  $: referenceSignal = resolvedSource.referenceSensor;
  $: isRefWeekly = referenceSignal ? referenceSignal.isWeeklySignal : false;
  $: referenceMetaData = referenceSignal ? $metaDataManager.getMetaData(referenceSignal) : null;
  $: coverageLevel = referenceSignal && referenceSignal.levels.includes('county') ? 'county' : 'state';

  $: coverage = referenceSignal ? fetchCoverage(referenceSignal, coverageLevel) : Promise.resolve([]);
  function findLatest(coverages, date) {
    return coverages.then((c) => findLatestCoverage(date, c));
  }
  $: pickedDate = referenceMetaData ? referenceMetaData.maxTime : new Date();
  $: latestCoverage = findLatest(coverage, pickedDate);
  $: data = getAvailableCounties(referenceSignal, pickedDate, coverageLevel);

  const domain = new TimeFrame(timeDay.offset(new Date(), -60), timeDay.floor(new Date()));

  function setSensor(d) {
    currentSensor.set(`${d.source}-${d.reference_signal}`);
  }

  function select(signal) {
    currentSensor.set(signal.key);
    switchToMode(modeByID['indicator-signal']);
  }
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>Indicator Status of <span>{resolvedSource ? resolvedSource.name : 'Data Source'}</span></h2>
    </div>
    <div class="uk-container content-grid">
      <SensorSourceSearch
        className="grid-3-11"
        modern
        items={$metaDataManager.metaSources}
        selectedItem={resolvedSource}
        on:change={(e) => setSensor(e.detail)}
      />
    </div>
  </div>
  <div class="uk-container content-grid">
    <AboutSection className="uk-margin-small-top uk-margin-small-bottom">
      <h3 class="mobile-h3">About {resolvedSource ? resolvedSource.name : '?'}</h3>
      {#if resolvedSource}
        <div>
          <SourceBadges source={resolvedSource} />
        </div>
        <div class="desc">
          {@html resolvedSource.description}
        </div>
        {#if resolvedSource.link.length > 0}
          <p>See also:</p>
          <ul>
            {#each resolvedSource.link as link}
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
      <FancyHeader invert sub="Information">Coverage</FancyHeader>
      {#if referenceSignal}
        <p>
          Reference Signal: <a
            href="../indicator-signal?sensor={referenceSignal.key}"
            on:click|preventDefault={() => select(referenceSignal)}
          >
            {referenceSignal.name}</a
          >
        </p>
      {/if}
    </div>
    <div class="grid-3-11">
      <div class="mobile-two-col">
        <div>
          <div>
            <KPI
              text={isRefWeekly
                ? formatWeek(referenceMetaData ? referenceMetaData.maxWeek : null)
                : formatDateISO(referenceMetaData ? referenceMetaData.maxTime : null)}
            />
          </div>
          <div class="sub">Latest Data Available</div>
        </div>
        <div>
          <div>
            <KPI text={toLagToToday(referenceMetaData)} />
          </div>
          <div class="sub">Lag to Today</div>
        </div>
        <div class="mobile-kpi">
          <div>
            <KPI
              text={isRefWeekly
                ? formatWeek(referenceMetaData ? referenceMetaData.maxIssueWeek : null)
                : formatDateISO(referenceMetaData ? referenceMetaData.maxIssue : null)}
            />
          </div>
          <div class="sub">Latest Issue</div>
        </div>
        <div class="mobile-kpi">
          <div>
            {#await latestCoverage then d}
              <KPIValue value={d} factor={100} />
            {/await}
          </div>
          <div class="sub">% of {getLevelInfo(coverageLevel).labelPlural} Available</div>
        </div>
      </div>
      <FancyHeader invert sub="{getLevelInfo(coverageLevel).labelPlural} Coverage"
        >{resolvedSource ? resolvedSource.name : '?'}</FancyHeader
      >
      <IndicatorCoverageChart
        signal={referenceSignal}
        initialDate={referenceMetaData.maxTime}
        {domain}
        data={coverage}
        level={coverageLevel}
        on:highlight={(e) => {
          const nextDate = e.detail || referenceMetaData.maxTime;
          if (nextDate != pickedDate) {
            pickedDate = nextDate;
          }
        }}
      />
      <FancyHeader invert sub="Map ({isRefWeekly ? formatWeek(pickedDate) : formatDateISO(pickedDate)})"
        >{resolvedSource ? resolvedSource.name : '?'}</FancyHeader
      >
    </div>
    <div class="grid-2-12">
      {#if coverageLevel === 'county'}
        <IndicatorCountyMap signal={referenceSignal} date={pickedDate} {data} />
      {:else if coverageLevel === 'state'}
        <IndicatorStateMap signal={referenceSignal} date={pickedDate} {data} />
      {:else}
        Not available
      {/if}
    </div>
    <div class="grid-3-11">
      <FancyHeader invert sub="Signals">Available</FancyHeader>
      <IndicatorSignalTable source={resolvedSource} />
    </div>
  </div>
</div>
