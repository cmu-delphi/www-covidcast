<script>
  import chevronLeftIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-left.svg';
  import { modeByID } from '..';
  import { countyInfo, nationInfo, stateInfo } from '../../maps';
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
          in new cases is reflected in deaths. <strong>R<sup>2</sup></strong> is defined as between <code>1.0</code>
          (entirely correlated), to <code>0.0</code> (no correlation at all).
        </p>
        <p>
          <strong>Lag</strong> is the number in days that an indicator can be shifted, with respect to another. For example,
          if we hypothesize that an increase in new cases results in an increase in hospitalizations three days later, the
          lag is three.
        </p>
      </AboutSection>
      <FancyHeader invert sub="Chart">R<sup>2</sup> per Lag</FancyHeader>
      <LagChart
        {primary}
        {secondary}
        {date}
        {region}
        {fetcher}
        lag={$currentLag}
        on:highlight={(e) => {
          const nextLag = e.detail || $currentLag;
          if (nextLag != $currentLag) {
            currentLag.set(nextLag);
          }
        }}
      />
      <p>
        Click on the R<sup>2</sup> chart to select a different lag
      </p>
      <hr />
      <FancyHeader invert sub="Chart at Lag {$currentLag} days">Correlation</FancyHeader>
      <IndicatorCorrelationChart {primary} {secondary} {date} {region} {fetcher} lag={$currentLag} />
    </div>
    <AboutSection>
      <h3 class="mobile-h3">About the SNAKE PLOT</h3>
      <p>A snake plot is a scatter plot of two indicators by date.</p>
      <p>Dots indicate the values of each indicator at two dates.</p>
      <p>You can shift the difference between these dates by adjusting the lag.</p>
      <p>
        The line between dots indicates how recent the observation was. The most recent days are thick, while those
        farthest in time are thin.
      </p>
      <p>For reference, each indicator is then separately shown by date.</p>
    </AboutSection>
    <div class="grid-3-11">
      <hr />
      <FancyHeader invert sub="Chart">{primary.name}</FancyHeader>
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
