<script>
  import { formatDateISO } from '../../formats';
  import KPI from '../survey/KPI.svelte';
  import SignalCountyMap from './SignalCountyMap.svelte';
  import FancyHeader from '../mobile/FancyHeader.svelte';

  /**
   * @type {import('../../data/indicatorInfo').IndicatorStatus}
   */
  export let signal;
</script>

<article class="uk-card uk-card-default uk-card-small question-card">
  <a href="#{signal.name}" id={signal.name} class="anchor"><span>Anchor</span></a>
  <div class="uk-card-header">
    <h3 class="uk-card-title">{signal.name}</h3>
  </div>
  <div class="uk-card-body question-body">
    <div class="mobile-two-col">
      <div class="mobile-kpi">
        <div>
          <KPI text={formatDateISO(signal.latest_issue_date)} />
        </div>
        <div class="sub">latest issue date</div>
      </div>
      <div>
        <div>
          <KPI text={formatDateISO(signal.latest_data_date)} />
        </div>
        <div class="sub">latest data date</div>
      </div>
    </div>

    <FancyHeader invert sub="Map ({formatDateISO(signal.latest_data_date)})">Coverage</FancyHeader>
    <SignalCountyMap {signal} date={signal.latest_data_date} />
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
