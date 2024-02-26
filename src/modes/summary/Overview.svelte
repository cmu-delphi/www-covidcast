<script>
  import KPIValue from '../../components/KPIValue.svelte';
  import KPIChange from '../../components/KPIChange.svelte';
  import { DateParam, SensorParam } from '../../stores/params';
  import SensorUnit from '../../components/SensorUnit.svelte';
  import IndicatorAnnotations from '../../components/IndicatorAnnotations.svelte';
  import MaxDateHint from '../../blocks/MaxDateHint.svelte';
  import IndicatorWarning from '../../blocks/IndicatorWarning.svelte';
  import NoRecentDataWarning from '../../blocks/NoRecentDataWarning.svelte';
  import { defaultDeathSensor, defaultCasesSensor, defaultHospitalSensor, metaDataManager } from '../../stores';
  import IndicatorFallbackWarning from '../../blocks/IndicatorFallbackWarning.svelte';
  import { onMount, afterUpdate, beforeUpdate } from 'svelte';

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

  function fetchFallback(fetcher, sensor, region, trend) {
    return trend.then((t) => {
      if (t && t.value != null) {
        return t;
      }
      return fetcher.fetch1Sensor1Region1DateTrend(sensor, region, DateParam.box(sensor.timeFrame.max));
    });
  }

  $: trends = fetcher.fetchNSensors1Region1DateTrend([CASES, HOSPITAL_ADMISSION, DEATHS], region, date);
  $: casesTrend = trends[0];
  $: hospitalTrend = fetchFallback(fetcher, HOSPITAL_ADMISSION, region, trends[1]);
  $: deathTrend = trends[2];

  let minMaxDate = new Date();
  let showWarning = false;

  onMount(() => {
    [CASES, DEATHS, HOSPITAL_ADMISSION].map((s) => {
      if (s.timeFrame.max < minMaxDate) {
        minMaxDate = s.timeFrame.max;
      }
    });
    let urlSeachParams = new URLSearchParams(window.location.search);
    if (!urlSeachParams.has('date')) {
      date.set(minMaxDate);
    }
  });

  beforeUpdate(() => {
    if (minMaxDate.toString() === date.value.toString()) {
      showWarning = true;
    }
  });

  afterUpdate(() => {
    if (minMaxDate.toString() != date.value.toString()) {
      showWarning = false;
    }
  });
</script>

<IndicatorWarning sensor={CASES} {date} {region} {fetcher} />
<IndicatorAnnotations {date} {region} sensor={CASES} range="sparkLine" />

{#if showWarning}
  <NoRecentDataWarning
    casesSensor={CASES}
    deathSensor={DEATHS}
    hospitalAdmissionSensor={HOSPITAL_ADMISSION}
    {date}
    {minMaxDate}
  />
{/if}

<!-- <p>
  On {formatDateDayOfWeek(date.value)}
  <MaxDateHint sensor={CASES.value} suffix="," {fetcher} />
  the {CASES.valueUnit}s were:
</p> -->

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
        <KPIValue value={d ? d.value : null} asterisk={d != null && (d.value == null || d.date < date.value)} />
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
        <KPIChange
          value={d && d.value != null && !Number.isNaN(d.value) ? d.change : null}
          asterisk={d != null && (d.value == null || d.date < date.value)}
        />
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

<IndicatorFallbackWarning trend={hospitalTrend} date={date.value} level={region.level} sensor={HOSPITAL_ADMISSION} />
