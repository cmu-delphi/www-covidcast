<script>
  import { formatDateISO } from '../../formats';
  import KPI from '../../components/KPI.svelte';
  // import IndicatorCountyMap from './IndicatorCountyMap.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  // import { getAvailableCounties } from '../../data/indicatorInfo';
  import KPIValue from '../../components/KPIValue.svelte';
  // import IndicatorCoverageChart from './IndicatorCoverageChart.svelte';
  import BackfillTimeProfile from './BackfillTimeProfile.svelte';
  import { nationInfo } from '../../data/regions';

  /**
   * @type {import('../../data/indicatorInfo').IndicatorStatus}
   */
  export let signal;

  /**
   * @type {import('../../stores/params').TimeFrame}
   */
  export let domain;

  console.log(domain);

  $: pickedDate = signal.latest_time_value;

  // $: data = getAvailableCounties(signal, pickedDate);
</script>

<div class="grid-3-11 uk-margin-top">
  <div class="mobile-two-col">
    <div>
      <div>
        <KPI text={formatDateISO(signal.latest_time_value)} />
      </div>
      <div class="sub">Latest Data Available</div>
    </div>
    <div>
      <div>
        <KPI text="{signal.latest_lag.toLocaleString()} days" />
      </div>
      <div class="sub">Lag to Today</div>
    </div>
    <div class="mobile-kpi">
      <div>
        <KPI text={formatDateISO(signal.latest_issue)} />
      </div>
      <div class="sub">Latest Issue</div>
    </div>
    <div class="mobile-kpi">
      <div>
        <KPIValue value={signal.latest_coverage} factor={100} />
      </div>
      <div class="sub">% of Counties Available</div>
    </div>
  </div>

  <hr />
  <FancyHeader invert sub="County Coverage">{signal ? signal.name : '?'}</FancyHeader>
  <!-- <IndicatorCoverageChart
    {signal}
    {domain}
    on:highlight={(e) => {
      const nextDate = e.detail || signal.latest_time_value;
      if (nextDate != pickedDate) {
        pickedDate = nextDate;
      }
    }}
  /> -->

  <hr />
  <FancyHeader invert sub="Map ({formatDateISO(pickedDate)})">{signal ? signal.name : '?'}</FancyHeader>
</div>
<!-- <div class="grid-2-12">
  <IndicatorCountyMap {signal} date={pickedDate} {data} />
</div> -->
<div class="grid-3-11">
  <FancyHeader invert sub="Backfill Profile">{signal ? signal.name : '?'}</FancyHeader>
</div>
<div class="grid-2-12">
  <BackfillTimeProfile indicator={signal} date={pickedDate} region={nationInfo} referenceAnchorLag={60} />
</div>
