<script>
  import { currentSensor, metaDataManager } from '../../stores';
  import { DEFAULT_SENSOR } from '../../stores/constants';
  import AboutSection from '../../components/AboutSection.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import { formatDateISO } from '../../formats';
  import KPI from '../../components/KPI.svelte';
  import KPIValue from '../../components/KPIValue.svelte';
  import IndicatorCoverageChart from './IndicatorCoverageChart.svelte';
  import IndicatorCountyMap from './IndicatorCountyMap.svelte';
  import IndicatorSignalTable from './IndicatorSignalTable.svelte';
  import { fetchCoverage, getAvailableCounties, findLatestCoverage, toLagToToday } from './data';
  import { TimeFrame } from '../../data/TimeFrame';
  import { timeDay } from 'd3-time';

  $: resolvedSource =
    $metaDataManager.getSensorSource($currentSensor) || $metaDataManager.getSensorSource(DEFAULT_SENSOR);

  $: referenceSignal = $metaDataManager.getReferenceSignal(resolvedSource);
  $: referenceMetaData = referenceSignal ? $metaDataManager.getMetaData(referenceSignal) : null;

  $: coverage = referenceSignal ? fetchCoverage(referenceSignal) : Promise.resolve([]);
  function findLatest(coverages, date) {
    return coverages.then((c) => findLatestCoverage(date, c));
  }
  $: latestCoverage = findLatest(coverage, pickedDate);
  $: pickedDate = referenceMetaData ? referenceMetaData.maxTime : new Date();
  $: data = getAvailableCounties(referenceSignal, pickedDate);

  const domain = new TimeFrame(timeDay.offset(new Date(), -60), timeDay.floor(new Date()));
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>Indicator Status <span>Source</span></h2>
    </div>
    Source Picker
  </div>
  <div class="uk-container content-grid">
    <AboutSection className="uk-margin-small-top uk-margin-small-bottom">
      <h3 class="mobile-h3">About {resolvedSource ? resolvedSource.name : '?'}</h3>
      <div class="desc">Name, API Name, Description, Link to API Docs</div>
    </AboutSection>
    <div class="grid-3-11">
      <hr />
      <FancyHeader invert sub="Information">Coverage</FancyHeader>
    </div>
    <AboutSection className="uk-margin-small-top uk-margin-small-bottom">
      <h3 class="mobile-h3">About Coverage Information</h3>
      <div class="desc">TODO</div>
    </AboutSection>
    <div class="grid-3-11">
      <div class="mobile-two-col">
        <div>
          <div>
            <KPI text={formatDateISO(referenceMetaData ? referenceMetaData.maxTime : null)} />
          </div>
          <div class="sub">Latest Data Available</div>
        </div>
        <div>
          <div>
            <KPI text="{toLagToToday(referenceMetaData)} days" />
          </div>
          <div class="sub">Lag to Today</div>
        </div>
        <div class="mobile-kpi">
          <div>
            <KPI text={formatDateISO(referenceMetaData ? referenceMetaData.maxIssue : null)} />
          </div>
          <div class="sub">Latest Issue</div>
        </div>
        <div class="mobile-kpi">
          <div>
            {#await latestCoverage then d}
              <KPIValue value={d} factor={100} />
            {/await}
          </div>
          <div class="sub">% of Counties Available</div>
        </div>
      </div>
      <FancyHeader invert sub="County Coverage">{resolvedSource ? resolvedSource.name : '?'}</FancyHeader>
      <IndicatorCoverageChart
        signal={referenceSignal}
        initialDate={referenceMetaData.maxTime}
        {domain}
        data={coverage}
        on:highlight={(e) => {
          const nextDate = e.detail || referenceMetaData.maxTime;
          if (nextDate != pickedDate) {
            pickedDate = nextDate;
          }
        }}
      />
      <FancyHeader invert sub="Map ({formatDateISO(pickedDate)})"
        >{resolvedSource ? resolvedSource.name : '?'}</FancyHeader
      >
    </div>
    <div class="grid-2-12">
      <IndicatorCountyMap signal={referenceSignal} date={pickedDate} {data} />
    </div>
    <div class="grid-3-11">
      <FancyHeader invert sub="Signals">Available</FancyHeader>
      <IndicatorSignalTable source={resolvedSource} />
    </div>
  </div>
</div>
