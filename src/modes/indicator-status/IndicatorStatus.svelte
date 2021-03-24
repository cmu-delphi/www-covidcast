<script>
  import { formatDateISO } from '../../formats';
  import KPI from '../survey/KPI.svelte';
  import IndicatorCountyMap from './IndicatorCountyMap.svelte';
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import { getAvailableCounties } from '../../data/indicatorInfo';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import IndicatorCoverageChart from './IndicatorCoverageChart.svelte';

  /**
   * @type {import('../../data/indicatorInfo').IndicatorStatus}
   */
  export let signal;

  /**
   * @type {import('../../stores/params').TimeFrame}
   */
  export let domain;

  $: pickedDate = signal.latest_time_value;

  $: data = getAvailableCounties(signal, pickedDate);
</script>

<div class="grid-3-11 uk-margin-top">
  <div class="mobile-two-col">
    <div>
      <div>
        <KPI text={formatDateISO(signal.latest_time_value)} />
      </div>
      <div class="sub">latest data date</div>
    </div>
    <div class="mobile-kpi">
      <div>
        <SurveyValue value={signal ? signal.latest_coverage : null} factor={100} />
      </div>
      <div class="sub">% of counties available</div>
    </div>
  </div>

  <FancyHeader invert sub="Coverage">{signal ? signal.name : '?'}</FancyHeader>
  <IndicatorCoverageChart
    {signal}
    {domain}
    on:highlight={(e) => {
      const nextDate = e.detail || signal.latest_time_value;
      if (nextDate != pickedDate) {
        pickedDate = nextDate;
      }
    }}
  />

  <FancyHeader invert sub="Map ({formatDateISO(pickedDate)})">{signal ? signal.name : '?'}</FancyHeader>
</div>
<div class="grid-2-12">
  <IndicatorCountyMap {signal} date={pickedDate} {data} />
</div>
