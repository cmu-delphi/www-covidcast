<script>
  import KPIValue from '../../components/KPIValue.svelte';
  import KPIChange from '../../components/KPIChange.svelte';
  import { SensorParam } from '../../stores/params';
  import SensorUnit from '../../components/SensorUnit.svelte';
  import MaxDateHint from '../../blocks/MaxDateHint.svelte';
  import NoRecentDataWarning from '../../blocks/NoRecentDataWarning.svelte';
  import { defaultDeathSensor, defaultCasesSensor, defaultHospitalSensor, metaDataManager } from '../../stores';
  import { onMount, beforeUpdate } from 'svelte';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  $: CASES = new SensorParam($defaultCasesSensor, $metaDataManager);
  $: DEATHS = new SensorParam($defaultDeathSensor, $metaDataManager);
  $: HOSPITAL_ADMISSION = new SensorParam($defaultHospitalSensor, $metaDataManager);

  $: trends = fetcher.fetchNSensors1Region1DateTrend([CASES, HOSPITAL_ADMISSION, DEATHS], region, date);
  $: casesTrend = trends[0];
  $: hospitalTrend = trends[1];
  $: deathTrend = trends[2];

  let minMaxDate = new Date();

  onMount(() => {
    [CASES, HOSPITAL_ADMISSION].map((s) => {
      if (s.timeFrame.max < minMaxDate) {
        minMaxDate = s.timeFrame.max;
      }
    });
    let urlSearchParams = new URLSearchParams(window.location.search);
    if (!urlSearchParams.has('date')) {
      // if no date is specified in the URL, default to the latest day before today with data from all 3 highlighted indicators
      date.set(minMaxDate);
    }
  });

  // warningType is indicator of which exact warning message should be shown.
  // By default, when user opens page with no specified date, the date will be set to the latest date we have data for all 3 indicators.
  // In this case, warningType should be set to 1.
  // In case selected date is set to future date (date > minMaxDate, where we don't have recent data for all 3 indicators), the warningType will be set to 2
  // which has different warning message.
  // In case selected date is set to some date which is < minMaxDate, the warningType will be set to 0 which means that we will not show
  // any warning message.

  // warningType should be set in beforeUpdate() method, to guess correct warningType.

  let warningType = 1;
  beforeUpdate(() => {
    if (date.value > minMaxDate) {
      warningType = 2;
    } else if (date.value < minMaxDate) {
      warningType = 0;
    } else {
      warningType = 1;
    }
    console.log(warningType);
  });
</script>

<NoRecentDataWarning {minMaxDate} {date} {warningType} />

<div class="mobile-three-col">
  <div class="mobile-kpi">
    <h3>
      Doctor Visits
      <MaxDateHint sensor={CASES.value} {fetcher} />
    </h3>
    <div>
      {#await casesTrend}
        <KPIValue value={null} loading />
      {:then d}
        <KPIValue value={d ? d.value : null} />
      {/await}
    </div>
    <div class="sub">
      <SensorUnit sensor={CASES} long />
    </div>
  </div>
  <div class="mobile-kpi">
    <h3>
      Hospital Admissions
      <MaxDateHint sensor={HOSPITAL_ADMISSION.value} {fetcher} />
    </h3>
    <div>
      {#await hospitalTrend}
        <KPIValue value={null} loading />
      {:then d}
        <KPIValue value={d ? d.value : null} />
      {/await}
    </div>
    <div class="sub">
      <SensorUnit sensor={HOSPITAL_ADMISSION} long />
    </div>
  </div>
  <div class="mobile-kpi">
    <h3>
      Deaths
      <MaxDateHint sensor={DEATHS.value} {fetcher} />
    </h3>
    <div>
      {#await deathTrend}
        <KPIValue value={null} loading />
      {:then d}
        <KPIValue value={d ? d.value : null} />
      {/await}
    </div>
    <div class="sub">
      <SensorUnit sensor={DEATHS} long />
    </div>
  </div>
</div>

<p>Compared to the previous week that means:</p>

<div class="mobile-three-col">
  <div class="mobile-kpi">
    <div>
      {#await casesTrend}
        <KPIChange value={null} loading />
      {:then d}
        <KPIChange value={d && d.value != null && !Number.isNaN(d.value) ? d.change : null} />
      {/await}
    </div>
    <div class="sub">Relative change to 7 days ago</div>
  </div>
  <div class="mobile-kpi">
    <div>
      {#await hospitalTrend}
        <KPIChange value={null} loading />
      {:then d}
        <KPIChange value={d && d.value != null && !Number.isNaN(d.value) ? d.change : null} />
      {/await}
    </div>
    <div class="sub">Relative change to 7 days ago</div>
  </div>
  <div class="mobile-kpi">
    <div>
      {#await deathTrend}
        <KPIChange value={null} loading />
      {:then d}
        <KPIChange value={d && d.value != null && !Number.isNaN(d.value) ? d.change : null} />
      {/await}
    </div>
    <div class="sub">Relative change to 7 days ago</div>
  </div>
</div>
