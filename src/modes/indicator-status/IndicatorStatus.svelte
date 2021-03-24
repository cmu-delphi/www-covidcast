<script>
  import { formatDateISO } from '../../formats';
  import KPI from '../survey/KPI.svelte';
  import IndicatorCountyMap from './IndicatorCountyMap.svelte';
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import { getAvailableCounties } from '../../data/indicatorInfo';
  import SurveyValue from '../survey/SurveyValue.svelte';
  import { countyInfo } from '../../maps';

  /**
   * @type {import('../../data/indicatorInfo').IndicatorStatus}
   */
  export let signal;

  $: data = getAvailableCounties(signal, signal.latest_data_date);

  $: coverage = data.then((rows) => rows.length / countyInfo.length);
</script>

<article class="uk-card uk-card-default uk-card-small question-card">
  <a href="#{signal.name}" id={signal.name} class="anchor"><span>Anchor</span></a>
  <div class="uk-card-header">
    <h3 class="uk-card-title">{signal.name}</h3>
  </div>
  <div class="uk-card-body question-body">
    <div class="mobile-two-col">
      <div>
        <div>
          <KPI text={formatDateISO(signal.latest_time_value)} />
        </div>
        <div class="sub">latest data date</div>
      </div>
      <div class="mobile-kpi">
        <div>
          {#await coverage}
            <SurveyValue value={null} loading />
          {:then coverage}
            <SurveyValue value={coverage} factor={100} />
          {/await}
        </div>
        <div class="sub">% of counties available</div>
      </div>
    </div>

    <FancyHeader invert sub="Map ({formatDateISO(signal.latest_time_value)})">Coverage</FancyHeader>
    <IndicatorCountyMap {signal} date={signal.latest_time_value} {data} />
  </div>
</article>

<style>
  .question-card {
    margin-bottom: 2em;
    border-radius: 8px;
  }
  .uk-card-header {
    background: #f2f2f2;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
  }

  .anchor {
    /** move anchor such that scrolling won't overlap with the sticky parameters */
    position: absolute;
    top: -160px;
    display: inline-block;
  }

  .anchor > span {
    display: none;
  }
</style>
