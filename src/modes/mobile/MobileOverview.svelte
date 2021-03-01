<script>
  import IndicatorTable from './IndicatorTable.svelte';
  import CasesOverview from './CasesOverview.svelte';
  import HighlightIndicators from './HighlightIndicators.svelte';
  import AllIndicatorOverview from './AllIndicatorOverview.svelte';
  import { countyInfo, nationInfo, stateInfo } from '../../maps';
  import SurveyParameters from '../survey/SurveyParameters.svelte';
  import { currentRegionInfo, currentSensorEntry, currentDateObject, times } from '../../stores';
  import { SensorParam, DateParam, RegionParam, DataFetcher } from '../../stores/params';
  import './common.css';

  $: sensor = new SensorParam($currentSensorEntry, $times);
  $: date = new DateParam($currentDateObject, $currentSensorEntry, $times);
  $: region = new RegionParam($currentRegionInfo);

  const items = [nationInfo, ...stateInfo, ...countyInfo];

  const fetcher = new DataFetcher();
  $: {
    // reactive update
    fetcher.invalidate(sensor, region, date);
  }
</script>

<div class="mobile-root">
  <SurveyParameters sensor={sensor.value} {items} placeholder="Search by State or County">
    <div class="grid-3-11 mobile-header-line" slot="title">
      <h2>COVIDcast <span>Overview</span></h2>
    </div>
  </SurveyParameters>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <CasesOverview {date} {region} {fetcher} />
      <hr />
      <AllIndicatorOverview {date} {region} {fetcher} />
      <hr />
      <HighlightIndicators {date} {region} {fetcher} />
      <hr />
      <IndicatorTable {date} {region} {fetcher} />
    </div>
  </div>
</div>
