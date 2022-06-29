<script>
  import KPIValue from '../../components/KPIValue.svelte';
  import KPIChange from '../../components/KPIChange.svelte';
  import { DateParam, SensorParam } from '../../stores/params';
  import { formatDateDayOfWeek, formatDateYearDayOfWeekAbbr } from '../../formats';
  import SensorUnit from '../../components/SensorUnit.svelte';
  import IndicatorAnnotations from '../../components/IndicatorAnnotations.svelte';
  import MaxDateHint from '../../blocks/MaxDateHint.svelte';
  import IndicatorWarning from '../../blocks/IndicatorWarning.svelte';
  import { defaultDeathSensor, defaultCasesSensor, defaultHospitalSensor, metaDataManager } from '../../stores';

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
</script>

<IndicatorWarning sensor={CASES} {date} {region} {fetcher} />
<IndicatorAnnotations {date} {region} sensor={CASES} range="sparkLine" />

<p>
  On {formatDateDayOfWeek(date.value)}
  <MaxDateHint sensor={CASES.value} suffix="," {fetcher} />
  the {CASES.valueUnit}s were:
</p>

<div class="mobile-three-col">
  <div class="mobile-kpi">
    <h3>Cases</h3>
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
    <h3>Hospital Admissions</h3>
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
    <h3>Deaths</h3>
    <div>
      {#await deathTrend}
        <KPIValue value={null} loading />
      {:then d}
        <KPIValue value={d ? d.value : null} />
      {/await}
    </div>
    <div class="sub">
      <SensorUnit sensor={CASES} long />
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

{#await hospitalTrend then d}
  {#if d != null && (d.value == null || d.date < date.value)}
    <p>
      * the indicator "{HOSPITAL_ADMISSION.name}" is not available for {formatDateYearDayOfWeekAbbr(date.value)}, yet.
      The data from {formatDateYearDayOfWeekAbbr(d.date)} is shown instead.
    </p>
  {/if}
{/await}
