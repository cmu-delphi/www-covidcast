<script>
  import KPIValue from '../../components/KPIValue.svelte';
  import KPIChange from '../../components/KPIChange.svelte';
  import { SensorParam } from '../../stores/params';
  import SensorUnit from '../../components/SensorUnit.svelte';
  import MaxDateHint from '../../blocks/MaxDateHint.svelte';
  import NoRecentDataWarning from '../../blocks/NoRecentDataWarning.svelte';
  import { defaultDeathSensor, defaultCasesSensor, defaultHospitalSensor, metaDataManager } from '../../stores';
  import { onMount } from 'svelte';

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

  // Get the latest date that has data for all 3 indicators(CASES, HOSPITAL_ADMISSION and DEATHS).
  $: minMaxDate = new Date(
    Math.min(
      ...[CASES, HOSPITAL_ADMISSION, DEATHS].map((s) => {
        // As DEATHS sensor is weekly based, we need to add 6 days to the max date of DEATHS sensor to get the last day of the week.
        if (s.name === 'COVID Deaths') {
          return s.timeFrame.max.getTime() + 6 * 24 * 60 * 60 * 1000; // add 6 days to the max date of DEATHS sensor to get the last day of the week.
        } else {
          return s.timeFrame.max;
        }
      }),
    ),
  );

  onMount(() => {
    let urlSearchParams = new URLSearchParams(window.location.search);
    if (!urlSearchParams.has('date')) {
      // if no date is specified in the URL, default to the latest day with data from 3 highlighted indicators (CASES, HOSPITAL_ADMISSION and DEATHS).
      date.set(minMaxDate);
    }
  });
</script>

<NoRecentDataWarning {minMaxDate} {date} />

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
