<script>
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { modeByID } from '..';
  import { countyInfo, nationInfo, stateInfo } from '../../data/regions';
  import {
    currentDateObject,
    currentMode,
    currentRegionInfo,
    currentSensor2,
    currentSensorEntry,
    currentSensorEntry2,
    times,
    currentLag,
  } from '../../stores';
  import { DataFetcher, DateParam, RegionParam, SensorParam } from '../../stores/params';
  import SurveyParameters from '../survey/SurveyParameters.svelte';
  import '../mobile/common.css';
  import IndicatorDropdown from '../mobile/IndicatorDropdown.svelte';
  import IndicatorCorrelationChart from './IndicatorCorrelationChart.svelte';
  import LagChart from './LagChart.svelte';
  import HistoryLineChart from '../mobile/HistoryLineChart.svelte';
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import { MULTI_COLORS } from '../../specs/lineSpec';
  import AboutSection from '../mobile/components/AboutSection.svelte';
  import { generateCorrelationMetrics } from '../../data/correlation';
  import throttle from 'lodash-es/throttle';

  $: primary = new SensorParam($currentSensorEntry);
  $: secondary = new SensorParam($currentSensorEntry2, currentSensor2);
  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);
  $: region = new RegionParam($currentRegionInfo);

  const items = [nationInfo, ...stateInfo, ...countyInfo];

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(primary, region, date);
  }

  function switchMode() {
    currentMode.set(modeByID.indicator);
  }

  /**
   * @param {TimeFrame} timeFrame
   * @param {number} lag
   */
  function computeDomains(timeFrame, lag) {
    if (lag > 0) {
      return {
        primary: timeFrame.shift(-lag, 0).domain,
        secondary: timeFrame.shift(0, lag).domain,
      };
    }
    return {
      primary: timeFrame.shift(0, -lag).domain,
      secondary: timeFrame.shift(lag, 0).domain,
    };
  }

  $: domains = computeDomains(date.windowTimeFrame, $currentLag);

  function loadData(primary, secondary, region, date) {
    if (!secondary | !primary) {
      return Promise.resolve([]);
    }
    const primaryData = fetcher.fetch1Sensor1RegionNDates(primary, region, date.windowTimeFrame);
    const secondaryData = fetcher.fetch1Sensor1RegionNDates(secondary, region, date.windowTimeFrame);
    return Promise.all([primaryData, secondaryData]).then((r) => {
      return generateCorrelationMetrics(r[0], r[1]).lags;
    });
  }

  $: lags = loadData(primary, secondary, region, date);

  function selectLag(lags, lag) {
    return lags.then((data) => data.find((d) => d.lag === lag) || null);
  }

  $: selectedLag = selectLag(lags, $currentLag);

  const throttleLagUpdate = throttle((nextLag) => {
    currentLag.set(nextLag);
  }, 10);
</script>

<div class="mobile-root">
  <SurveyParameters sensor={primary.value} {items} defaultItem={nationInfo} placeholder="Search by State or County">
    <div class="grid-3-11 mobile-header-line" slot="title">
      <button class="mobile-back inline-svg-icon" on:click={switchMode}>
        {@html chevronLeftIcon}
      </button>
      <h2>Explore <span>Correlations</span></h2>
    </div>
    <div class="uk-container content-grid uk-margin-remove-vertical">
      <IndicatorDropdown sensor={primary} className="grid-3-7" label="First Indicator" />
      <IndicatorDropdown sensor={secondary} className="grid-7-11" label="Second Indicator" />
    </div>
  </SurveyParameters>

  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <AboutSection>
        <h3 class="mobile-h3">About INDICATOR CORRELATIONS</h3>
        <p>
          This illustration of correlation does not imply causation, but correlations can hint at underlying behavior.
        </p>
        <p>
          The <strong>coefficient of determination</strong> (or <strong>R<sup>2</sup></strong>) is a measure of linear
          correlation that indicates the proportion of the variance in one indicator as explained by variance of
          another.
        </p>
        <p>
          In other words, how much does the movement in one indicator explain movement in another? For example, a change
          in new cases is reflected in deaths.
          <strong>R<sup>2</sup></strong> ranges between <code>1.0</code> (entirely correlated) and <code>0.0</code> (no correlation
          at all).
        </p>
        <p>
          <strong>Lag</strong> is the number of days that an indicator is shifted backwards with respect to another. For
          example, if we hypothesize that an increase in new cases results in an increase in hospitalizations three days
          later, hospitalizations are lagged 3 days. A negative lag would indicate the indicator is shifted forwards.
        </p>
      </AboutSection>
      <FancyHeader invert sub="Correlations">Lagged</FancyHeader>
      <LagChart
        {primary}
        {secondary}
        {lags}
        lag={$currentLag}
        on:highlight={(e) => {
          // don't use || since 0 == false
          const nextLag = e.detail == null ? $currentLag : e.detail;
          if (nextLag !== $currentLag) {
            throttleLagUpdate(nextLag);
          }
        }}
      />
      <p>
        Click on or mouse over the R<sup>2</sup> chart to select a different lag.
      </p>
      <hr />
      <FancyHeader invert sub="Chart">Correlation</FancyHeader>
      <AboutSection details>
        <h3 class="mobile-h3" slot="header">About the SNAKE PLOT</h3>
        <p>
          A snake plot is a special kind of scatter plot. Each point plots the value of the first indicator against the
          value of the second indicator, and the points are connected in chronological order.
        </p>
        <p>
          The line weight indicates how recent the observation was. The most recent days are thick, while those farthest
          in the past are thin.
        </p>
        <p>
          The line weight key corresponds to the dates used by the first indicator. The dates used by the second
          indicator are offset from the first by a number of days, as specified by the current lag.
        </p>
      </AboutSection>
      <p />
      <IndicatorCorrelationChart {primary} {secondary} lag={$currentLag} {lags} lagData={selectedLag} />
      <hr />
      <FancyHeader invert sub="Chart">{primary.name}</FancyHeader>
      <AboutSection details>
        <h3 class="mobile-h3" slot="header">About the TIME SERIES</h3>
        <p>The x-axes in the time series plots below are offset from each other by the selected lag.</p>
      </AboutSection>
      <p />
      <div class="chart-300">
        <HistoryLineChart sensor={primary} {date} {region} {fetcher} singleRegionOnly domain={domains.primary} />
      </div>
      <hr />
      <FancyHeader invert sub="Chart">{secondary.name}</FancyHeader>
      <div class="chart-300">
        <HistoryLineChart
          sensor={secondary}
          {date}
          {region}
          {fetcher}
          singleRegionOnly
          color={MULTI_COLORS[1]}
          domain={domains.secondary}
        />
      </div>
    </div>
  </div>
</div>
