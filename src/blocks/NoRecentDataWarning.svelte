<script>
  import { formatAPITime } from '../data';
  import { formatDateYearDayOfWeekAbbr } from '../formats';
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../stores/params").DateParam}
   */
  export let minMaxDate;
  /**
   * @type {import('../stores/params').SensorParam}
   */
  export let casesSensor;
  /**
   * @type {import('../stores/params').SensorParam}
   */
  export let deathSensor;
  /**
   * @type {import('../stores/params').SensorParam}
   */
  export let hospitalAdmissionSensor;

  let todaysDate = new Date();
  let casesMaxDate = new Date();
  let deathSensorMaxDate = new Date();
  let hospitalAdmissionMaxDate = new Date();

  casesMaxDate = casesSensor.timeFrame.max;
  deathSensorMaxDate = deathSensor.timeFrame.max;
  hospitalAdmissionMaxDate = hospitalAdmissionSensor.timeFrame.max;
</script>

{#if casesMaxDate.toString() != date.value.toString() || deathSensorMaxDate.toString() != date.value.toString() || hospitalAdmissionMaxDate.toString() != date.value.toString()}
  <div data-uk-alert class="uk-alert-warning">
    <p>
      The data for the {formatDateYearDayOfWeekAbbr(todaysDate)} is not available yet. The latest known data for all indicators
      is available on
      <a href="?date={formatAPITime(minMaxDate.value)}&{window.location.search.split('&').slice(1).join('&')}"
        >{formatDateYearDayOfWeekAbbr(minMaxDate)}</a
      >.
    </p>
  </div>
{/if}
